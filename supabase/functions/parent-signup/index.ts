import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const BodySchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  displayName: z.string().trim().min(1).max(100),
  studentNumber: z.string().trim().min(1).max(50),
  captchaToken: z.string().min(1).max(4096),
  redirectTo: z.string().url().max(500).optional(),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY is not configured");
    return false;
  }
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const outcome = await res.json();
  return outcome?.success === true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ success: false, error: "Datos inválidos. Revisa el formulario." }, 200);
    }
    const { email, password, displayName, studentNumber, captchaToken, redirectTo } = parsed.data;

    // 1. Verify the Turnstile (anti-bot) challenge.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const human = await verifyTurnstile(captchaToken, ip);
    if (!human) {
      return json({ success: false, error: "Verificación anti-robot fallida. Intenta de nuevo." }, 200);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 2. Verify the student number belongs to an enrolled student.
    const { data: student, error: studentError } = await admin
      .from("allowed_students")
      .select("id")
      .eq("student_number", studentNumber)
      .maybeSingle();

    if (studentError) {
      console.error("Student lookup error:", studentError);
      return json({ success: false, error: "Error del servidor. Intenta más tarde." }, 200);
    }
    if (!student) {
      return json({
        success: false,
        error: "Número de estudiante no válido. Verifica el número o contacta al preescolar.",
      }, 200);
    }

    // 3. Create the account as UNVERIFIED — the parent must confirm via email.
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { display_name: displayName },
    });

    if (createError) {
      const msg = createError.message?.toLowerCase() ?? "";
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return json({ success: false, error: "Ya existe una cuenta con este correo." }, 200);
      }
      console.error("createUser error:", createError);
      return json({ success: false, error: "No se pudo crear la cuenta. Intenta de nuevo." }, 200);
    }

    // 4. Trigger the built-in confirmation email for the new unverified user.
    const anon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { error: resendError } = await anon.auth.resend({
      type: "signup",
      email,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    });

    if (resendError) {
      console.error("Confirmation email error:", resendError);
      return json({ success: true, emailSent: false });
    }

    return json({ success: true, emailSent: true });
  } catch (e) {
    console.error("parent-signup error:", e);
    return json({ success: false, error: "Error del servidor." }, 200);
  }
});
