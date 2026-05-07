import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const password = typeof body?.password === "string" ? body.password : "";

    if (!password || password.length > 200) {
      return new Response(JSON.stringify({ error: "Contraseña inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expected = Deno.env.get("PARENT_PORTAL_PASSWORD") ?? "";
    const tuitionUrl = Deno.env.get("PARENT_PORTAL_TUITION_URL") ?? "";

    if (!expected || password !== expected) {
      // small delay to slow brute force
      await new Promise((r) => setTimeout(r, 600));
      return new Response(JSON.stringify({ error: "Contraseña incorrecta" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ tuitionUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Error del servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
