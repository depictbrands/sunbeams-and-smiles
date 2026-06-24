import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const BodySchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  displayName: z.string().trim().min(1).max(100),
  studentNumber: z.string().trim().min(1).max(50),
  studentName: z.string().trim().min(1).max(150),
  captchaToken: z.string().min(1).max(4096),
  redirectTo: z.string().url().max(500).optional(),
});

const VERIFY_ERROR =
  "No pudimos verificar este número de estudiante. Por favor contacta a la administración de SonSoles.";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
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
    const { email, password, displayName, studentNumber, studentName, captchaToken, redirectTo } = parsed.data;

    // 1. Verify the Turnstile (anti-bot) challenge.
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const human = await verifyTurnstile(captchaToken, ip);
    if (!human) {
      return json({ success: false, error: "Verificación anti-robot fallida. Intenta de nuevo." }, 200);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 2. Verify the student number belongs to an active enrolled student whose name matches.
    const { data: student, error: studentError } = await admin
      .from("allowed_students")
      .select("id, student_name, status, parent_user_id")
      .eq("student_number", studentNumber)
      .maybeSingle();

    if (studentError) {
      console.error("Student lookup error:", studentError);
      return json({ success: false, error: "Error del servidor. Intenta más tarde." }, 200);
    }
    if (!student || student.status !== "active") {
      return json({ success: false, error: VERIFY_ERROR }, 200);
    }
    if (!student.student_name || normalizeName(student.student_name) !== normalizeName(studentName)) {
      return json({ success: false, error: VERIFY_ERROR }, 200);
    }
    if (student.parent_user_id) {
      return json({
        success: false,
        error: "Este estudiante ya está vinculado a una cuenta de padre/madre. Contacta a la administración de SonSoles.",
      }, 200);
    }

    // 3. Create the account as UNVERIFIED — the parent must confirm via email.
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { display_name: displayName },
    });

    if (createError || !created?.user) {
      const msg = createError?.message?.toLowerCase() ?? "";
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return json({ success: false, error: "Ya existe una cuenta con este correo." }, 200);
      }
      console.error("createUser error:", createError);
      return json({ success: false, error: "No se pudo crear la cuenta. Intenta de nuevo." }, 200);
    }

    // 4. Link the verified parent to the student record.
    const { error: linkError } = await admin
      .from("allowed_students")
      .update({ parent_user_id: created.user.id })
      .eq("id", student.id)
      .is("parent_user_id", null);

    if (linkError) {
      console.error("Failed to link parent to student:", linkError);
      // Roll back the auth user so they can retry cleanly.
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ success: false, error: "No se pudo vincular el estudiante. Intenta de nuevo." }, 200);
    }

    // 5. Trigger the built-in confirmation email for the new unverified user.
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
