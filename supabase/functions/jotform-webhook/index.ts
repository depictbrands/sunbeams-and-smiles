// Jotform webhook → Lovable Cloud
// Receives form submissions, finds the matching student by student number,
// downloads attached files via Jotform API, and stores them in the student's
// expediente as `category = 'admision'`.
//
// Setup in Jotform:
//   1. Open the form → Settings → Integrations → Webhooks
//   2. Add: https://<project>.functions.supabase.co/jotform-webhook
//   3. Make sure the form has a field whose answer is the student number
//      (label can contain "estudiante" / "student" / "numero").
//
// Required runtime secrets:
//   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-provided)
//   - JOTFORM_API_KEY  (used to download file uploads from Jotform)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const STUDENT_FIELD_HINTS = ["estudiante", "student", "numero", "número", "id"];

// Map Jotform formID (or Sign documentID) → expediente category.
// Default (unknown form) → "admision" to preserve previous behavior.
const FORM_CATEGORY_MAP: Record<string, string> = {
  "261398147565064": "admision", // Solicitud de admisión (form original)
  "261795577609071": "admision", // Solicitud de admisión (Jotform Sign)
  "261765113685058": "medicamentos", // Autorización Para Administrar Medicamentos (Jotform Sign)
  "261475647186064": "historial_medico", // Historial Médico
  "261795397226066": "expediente", // Documentos Para Completar Expediente (Jotform Sign)
};

const CATEGORY_TITLES: Record<string, string> = {
  admision: "Solicitud de admisión (Jotform)",
  medicamentos: "Autorización para administrar medicamentos (Jotform)",
  historial_medico: "Historial médico (Jotform)",
  expediente: "Documentos para completar expediente (Jotform)",
};

// Collect every string value in the submission (Jotform Sign nests answers in
// objects/arrays, so a flat key scan is not enough).
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

function pickStudentNumber(raw: Record<string, unknown>): string | null {
  // Jotform `rawRequest` keys look like "q5_studentNumber" / "q12_numeroDe".
  for (const [k, v] of Object.entries(raw)) {
    const key = k.toLowerCase();
    if (STUDENT_FIELD_HINTS.some((h) => key.includes(h))) {
      const found = collectStrings(v);
      if (found.length) return found[0];
    }
  }
  return null;
}


function collectFileUrls(raw: Record<string, unknown>): string[] {
  const urls: string[] = [];
  const walk = (val: unknown) => {
    if (!val) return;
    if (typeof val === "string") {
      if (/^https?:\/\/.*jotform.*\/uploads\//i.test(val)) urls.push(val);
      return;
    }
    if (Array.isArray(val)) val.forEach(walk);
    else if (typeof val === "object") Object.values(val as Record<string, unknown>).forEach(walk);
  };
  walk(raw);
  return [...new Set(urls)];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const JOTFORM_API_KEY = Deno.env.get("JOTFORM_API_KEY");
  if (!SUPABASE_URL || !SERVICE_KEY) return json(500, { error: "missing_config" });

  // Jotform posts multipart/form-data with `formID`, `submissionID`, `rawRequest`.
  // Jotform Sign posts similar fields plus `documentID`.
  let submissionId = "";
  let formId = "";
  let raw: Record<string, unknown> = {};
  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const body = await req.json();
      submissionId = String(body.submissionID ?? body.submission_id ?? "");
      formId = String(body.formID ?? body.documentID ?? body.formId ?? "");
      raw = typeof body.rawRequest === "string" ? JSON.parse(body.rawRequest) : (body.rawRequest ?? body);
    } else {
      const fd = await req.formData();
      submissionId = String(fd.get("submissionID") ?? "");
      formId = String(fd.get("formID") ?? fd.get("documentID") ?? "");
      const rawStr = fd.get("rawRequest");
      raw = typeof rawStr === "string" && rawStr ? JSON.parse(rawStr) : {};
    }
  } catch (e) {
    return json(400, { error: "bad_payload", detail: String(e) });
  }

  const category = FORM_CATEGORY_MAP[formId] ?? "admision";

  console.log("jotform-webhook received", {
    formId,
    submissionId,
    category,
    rawKeys: Object.keys(raw),
  });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // Normalize: match on digits-only so "2026285" matches "2026-285", etc.
  const digitsOnly = (s: string) => (s || "").replace(/\D+/g, "");

  const { data: candidates, error: stuErr } = await supabase
    .from("allowed_students")
    .select("id, parent_user_id, student_number");
  if (stuErr) return json(500, { error: "lookup_failed", detail: stuErr.message });

  const matchStudent = (value: string) => {
    const d = digitsOnly(value);
    return (candidates || []).find((s: any) => {
      const sn = (s.student_number || "").toString();
      return (
        sn.toLowerCase() === value.toLowerCase() ||
        (d.length >= 4 && digitsOnly(sn) === d)
      );
    });
  };

  // 1) Preferred: a field whose label hints at "estudiante"/"student"/"número".
  let studentNumber = pickStudentNumber(raw);
  let student = studentNumber ? matchStudent(studentNumber) : undefined;

  // 2) Fallback: scan every value in the submission for a known student number.
  if (!student) {
    for (const value of collectStrings(raw)) {
      const found = matchStudent(value);
      if (found) {
        student = found;
        studentNumber = value;
        break;
      }
    }
  }

  if (!student) {
    console.log("jotform-webhook: student not found", { formId, submissionId, studentNumber });
    return json(200, { ok: false, reason: "student_not_found", studentNumber, submissionId });
  }

  console.log("jotform-webhook: matched student", {
    submissionId,
    studentId: student.id,
    studentNumber,
    linkedToParent: !!student.parent_user_id,
  });



  // Save submission JSON as a record for traceability.
  const ts = Date.now();
  const baseDir = `students/${student.id}/${category}/${ts}-${submissionId || "jf"}`;
  const records: { path: string; name: string; size: number; mime: string }[] = [];

  const summaryBlob = new Blob([JSON.stringify(raw, null, 2)], { type: "application/json" });
  const summaryPath = `${baseDir}/submission.json`;
  await supabase.storage.from("parent-documents").upload(summaryPath, summaryBlob, {
    contentType: "application/json",
    upsert: false,
  });
  records.push({ path: summaryPath, name: "submission.json", size: summaryBlob.size, mime: "application/json" });

  // Download Jotform-attached files.
  const fileUrls = collectFileUrls(raw);
  for (const url of fileUrls) {
    try {
      const fetchUrl = JOTFORM_API_KEY ? `${url}${url.includes("?") ? "&" : "?"}apiKey=${encodeURIComponent(JOTFORM_API_KEY)}` : url;
      const res = await fetch(fetchUrl);
      if (!res.ok) continue;
      const buf = new Uint8Array(await res.arrayBuffer());
      const mime = res.headers.get("content-type") ?? "application/octet-stream";
      const name = decodeURIComponent(url.split("/").pop() ?? `file-${ts}`);
      const path = `${baseDir}/${name}`;
      const { error: upErr } = await supabase.storage
        .from("parent-documents")
        .upload(path, buf, { contentType: mime, upsert: false });
      if (!upErr) records.push({ path, name, size: buf.byteLength, mime });
    } catch (_e) { /* skip individual file failures */ }
  }

  // Jotform Sign documents have no "uploads/" URL — fetch the signed PDF directly.
  if (JOTFORM_API_KEY && submissionId && !records.some((r) => r.mime.includes("pdf"))) {
    const pdfEndpoints = [
      `https://www.jotform.com/pdf-submission/${submissionId}?download=1&apiKey=${encodeURIComponent(JOTFORM_API_KEY)}`,
      `https://api.jotform.com/submission/${submissionId}/pdf?apiKey=${encodeURIComponent(JOTFORM_API_KEY)}&download=1`,
    ];
    for (const endpoint of pdfEndpoints) {
      try {
        const res = await fetch(endpoint);
        const mime = res.headers.get("content-type") ?? "";
        if (!res.ok || !mime.includes("pdf")) continue;
        const buf = new Uint8Array(await res.arrayBuffer());
        const name = `${submissionId}.pdf`;
        const path = `${baseDir}/${name}`;
        const { error: upErr } = await supabase.storage
          .from("parent-documents")
          .upload(path, buf, { contentType: "application/pdf", upsert: false });
        if (!upErr) {
          records.push({ path, name, size: buf.byteLength, mime: "application/pdf" });
          break;
        }
      } catch (_e) { /* try next endpoint */ }
    }
  }


  // Insert one parent_documents row per stored file.
  for (const r of records) {
    const { error: insErr } = await supabase.from("parent_documents").insert({
      user_id: student.parent_user_id,
      document_type: "admin_assigned",
      file_path: r.path,
      file_name: r.name,
      file_size: r.size,
      mime_type: r.mime,
      title: r.name === "submission.json" ? (CATEGORY_TITLES[category] ?? r.name) : r.name,
      student_id: student.id,
      category,
      jotform_submission_id: submissionId || null,
    });
    if (insErr) console.error("jotform-webhook: insert failed", { path: r.path, error: insErr.message });
  }
  console.log("jotform-webhook: stored documents", { submissionId, saved: records.length, category });


  return json(200, {
    ok: true,
    studentNumber,
    studentId: student.id,
    saved: records.length,
    linkedToParent: !!student.parent_user_id,
  });
});
