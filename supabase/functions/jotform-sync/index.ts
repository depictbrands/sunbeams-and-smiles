import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const FORM_CATEGORY_MAP: Record<string, string> = {
  "261398147565064": "admision",
  "261795577609071": "admision",
  "261765113685058": "medicamentos",
  "261475647186064": "historial_medico",
  "261795397226066": "expediente",
};

const CATEGORY_TITLES: Record<string, string> = {
  admision: "Solicitud de admisión (Jotform)",
  medicamentos: "Autorización para administrar medicamentos (Jotform)",
  historial_medico: "Historial médico (Jotform)",
  expediente: "Documentos para completar expediente (Jotform)",
};

const STUDENT_FIELD_HINTS = ["estudiante", "student", "numero", "número", "id"];

const ALLOWED_JOTFORM_HOSTS = [
  "jotform.com",
  "jotform.us",
  "jotform.io",
  "jotformeu.com",
  "jotformz.com",
  "jotformpro.com",
];

function isAllowedJotformUrl(value: string): boolean {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    return ALLOWED_JOTFORM_HOSTS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

function collectStrings(val: unknown, out: string[] = []): string[] {
  if (typeof val === "string") {
    if (val.trim()) out.push(val.trim());
  } else if (Array.isArray(val)) {
    val.forEach((v) => collectStrings(v, out));
  } else if (val && typeof val === "object") {
    Object.values(val as Record<string, unknown>).forEach((v) => collectStrings(v, out));
  }
  return out;
}

function collectFileUrls(val: unknown, urls: string[] = []): string[] {
  if (typeof val === "string") {
    if (/^https?:\/\/.*jotform.*\/uploads\//i.test(val)) urls.push(val);
  } else if (Array.isArray(val)) {
    val.forEach((v) => collectFileUrls(v, urls));
  } else if (val && typeof val === "object") {
    Object.values(val as Record<string, unknown>).forEach((v) => collectFileUrls(v, urls));
  }
  return [...new Set(urls)];
}

// Flatten a Jotform API submission into { answers: {...}, strings }
function flattenAnswers(submission: any): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const answers = submission?.answers ?? {};
  for (const [qid, ans] of Object.entries<any>(answers)) {
    const label = String(ans?.name ?? ans?.text ?? qid).toLowerCase();
    out[`q${qid}_${label}`] = ans?.prettyFormat ?? ans?.answer ?? "";
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const JOTFORM_API_KEY = Deno.env.get("JOTFORM_API_KEY");
  if (!SUPABASE_URL || !SERVICE_KEY) return json(500, { error: "missing_config" });
  if (!JOTFORM_API_KEY) return json(500, { error: "missing_jotform_api_key" });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // Auth: admin JWT, or internal call with the service-role key.
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const syncToken = Deno.env.get("JOTFORM_SYNC_TOKEN");
  let authorized =
    token === SERVICE_KEY ||
    (!!syncToken && (req.headers.get("x-sync-token") === syncToken || token === syncToken));
  if (!authorized && token) {
    const { data: userData } = await supabase.auth.getUser(token);
    const uid = userData?.user?.id;
    if (uid) {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "admin");
      authorized = !!roles?.length;
    }
  }
  if (!authorized) return json(401, { error: "unauthorized" });

  let requestedForms: string[] = Object.keys(FORM_CATEGORY_MAP);
  let diag = false;
  try {
    const body = await req.json();
    if (Array.isArray(body?.formIds) && body.formIds.length) {
      requestedForms = body.formIds.map((f: unknown) => String(f)).filter((f: string) => /^\d{6,24}$/.test(f));
    }
    diag = body?.diag === true;
  } catch { /* no body */ }

  const { data: candidates } = await supabase
    .from("allowed_students")
    .select("id, parent_user_id, student_number");

  const digitsOnly = (s: string) => (s || "").replace(/\D+/g, "");
  const matchStudent = (value: string) => {
    const d = digitsOnly(value);
    return (candidates || []).find((s: any) => {
      const sn = (s.student_number || "").toString();
      return sn.toLowerCase() === value.toLowerCase() || (d.length >= 4 && digitsOnly(sn) === d);
    });
  };

  const summary: Record<string, unknown>[] = [];

  // Diagnostics: verify the API key can read the account at all.
  if (diag === "dump") {
    const res = await fetch(
      `https://api.jotform.com/form/${requestedForms[0]}/submissions?apiKey=${encodeURIComponent(JOTFORM_API_KEY)}&limit=5`,
    );
    const payload = await res.json().catch(() => ({}));
    return json(200, { ok: true, dump: payload?.content });
  }

  if (diag) {
    const probes: Record<string, unknown> = {};
    const urls: Record<string, string> = {
      user: `https://api.jotform.com/user?apiKey=${encodeURIComponent(JOTFORM_API_KEY)}`,
      forms: `https://api.jotform.com/user/forms?apiKey=${encodeURIComponent(JOTFORM_API_KEY)}&limit=50`,
      submissions: `https://api.jotform.com/user/submissions?apiKey=${encodeURIComponent(JOTFORM_API_KEY)}&limit=5`,
      signDocuments: `https://api.jotform.com/sign/documents?apiKey=${encodeURIComponent(JOTFORM_API_KEY)}&limit=50`,
    };
    for (const [name, url] of Object.entries(urls)) {
      try {
        const res = await fetch(url);
        const payload = await res.json();
        probes[name] = res.ok
          ? Array.isArray(payload?.content)
            ? payload.content.map((f: any) => ({ id: f.id ?? f.documentID, title: f.title ?? f.name, status: f.status }))
            : { ok: true }
          : { status: res.status, message: payload?.message };
      } catch (e) {
        probes[name] = { error: String(e) };
      }
    }
    return json(200, { ok: true, diag: probes });
  }

  for (const formId of requestedForms) {
    const category = FORM_CATEGORY_MAP[formId] ?? "admision";
    let submissions: any[] = [];
    const attempts: Record<string, unknown>[] = [];
    try {
      const endpoints = [
        `https://api.jotform.com/form/${formId}/submissions?apiKey=${encodeURIComponent(JOTFORM_API_KEY)}&limit=100&orderby=created_at`,
        `https://api.jotform.com/sign/documents/${formId}/submissions?apiKey=${encodeURIComponent(JOTFORM_API_KEY)}&limit=100`,
        `https://api.jotform.com/sign/documents/${formId}/signers?apiKey=${encodeURIComponent(JOTFORM_API_KEY)}`,
      ];
      for (const endpoint of endpoints) {
        const res = await fetch(endpoint);
        const payload = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(payload?.content)) {
          submissions = payload.content;
          break;
        }
        attempts.push({ endpoint: endpoint.split("?")[0], status: res.status, message: payload?.message });
      }
      if (!submissions.length) {
        summary.push({ formId, error: "no_submissions_readable", attempts });
        continue;
      }
    } catch (e) {
      summary.push({ formId, error: String(e) });
      continue;
    }

    let imported = 0;
    let skipped = 0;
    let unmatched = 0;

    for (const sub of submissions) {
      const submissionId = String(sub?.id ?? "");
      if (!submissionId) continue;

      const { data: existing } = await supabase
        .from("parent_documents")
        .select("id")
        .eq("jotform_submission_id", submissionId)
        .limit(1);
      if (existing?.length) { skipped++; continue; }

      const raw = flattenAnswers(sub);

      let studentNumber: string | null = null;
      let student: any = undefined;
      for (const [k, v] of Object.entries(raw)) {
        if (STUDENT_FIELD_HINTS.some((h) => k.toLowerCase().includes(h))) {
          const found = collectStrings(v);
          if (found.length) {
            const m = matchStudent(found[0]);
            if (m) { student = m; studentNumber = found[0]; break; }
          }
        }
      }
      if (!student) {
        for (const value of collectStrings(raw)) {
          const m = matchStudent(value);
          if (m) { student = m; studentNumber = value; break; }
        }
      }
      if (!student) { unmatched++; continue; }

      const ts = Date.now();
      const baseDir = `students/${student.id}/${category}/${ts}-${submissionId}`;
      const records: { path: string; name: string; size: number; mime: string }[] = [];

      const summaryBlob = new Blob([JSON.stringify(sub, null, 2)], { type: "application/json" });
      const summaryPath = `${baseDir}/submission.json`;
      await supabase.storage.from("parent-documents").upload(summaryPath, summaryBlob, {
        contentType: "application/json",
        upsert: false,
      });
      records.push({ path: summaryPath, name: "submission.json", size: summaryBlob.size, mime: "application/json" });

      for (const url of collectFileUrls(raw)) {
        if (!isAllowedJotformUrl(url)) continue;
        try {
          const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}apiKey=${encodeURIComponent(JOTFORM_API_KEY)}`);
          if (!res.ok) continue;
          const buf = new Uint8Array(await res.arrayBuffer());
          const mime = res.headers.get("content-type") ?? "application/octet-stream";
          const name = decodeURIComponent(url.split("/").pop() ?? `file-${ts}`);
          const path = `${baseDir}/${name}`;
          const { error: upErr } = await supabase.storage
            .from("parent-documents")
            .upload(path, buf, { contentType: mime, upsert: false });
          if (!upErr) records.push({ path, name, size: buf.byteLength, mime });
        } catch { /* skip */ }
      }

      if (!records.some((r) => r.mime.includes("pdf"))) {
        const endpoints = [
          `https://www.jotform.com/pdf-submission/${submissionId}?download=1&apiKey=${encodeURIComponent(JOTFORM_API_KEY)}`,
          `https://api.jotform.com/submission/${submissionId}/pdf?apiKey=${encodeURIComponent(JOTFORM_API_KEY)}&download=1`,
        ];
        for (const endpoint of endpoints) {
          try {
            const res = await fetch(endpoint, { redirect: "follow" });
            const mime = res.headers.get("content-type") ?? "";
            if (!res.ok || !mime.includes("pdf")) continue;
            const buf = new Uint8Array(await res.arrayBuffer());
            const name = `${(CATEGORY_TITLES[category] ?? "documento").replace(/[^\w\s\-áéíóúñÁÉÍÓÚÑ]/g, "")}.pdf`;
            const path = `${baseDir}/${name}`;
            const { error: upErr } = await supabase.storage
              .from("parent-documents")
              .upload(path, buf, { contentType: "application/pdf", upsert: false });
            if (!upErr) { records.push({ path, name, size: buf.byteLength, mime: "application/pdf" }); break; }
          } catch { /* next */ }
        }
      }

      for (const r of records) {
        await supabase.from("parent_documents").insert({
          user_id: student.parent_user_id,
          document_type: "admin_assigned",
          file_path: r.path,
          file_name: r.name,
          file_size: r.size,
          mime_type: r.mime,
          title: r.name === "submission.json" ? (CATEGORY_TITLES[category] ?? r.name) : r.name,
          student_id: student.id,
          category,
          jotform_submission_id: submissionId,
        });
      }
      imported++;
    }

    summary.push({ formId, category, total: submissions.length, imported, skipped, unmatched });
  }

  console.log("jotform-sync done", summary);
  return json(200, { ok: true, results: summary });
});
