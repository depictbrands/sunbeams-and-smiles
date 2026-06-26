import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Trash2, Download, Loader2, AlertCircle, FileSignature, Syringe, HeartPulse, Folder, Pill } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Student = {
  id: string;
  student_number: string;
  student_name: string | null;
  group_name: string | null;
  parent_user_id: string | null;
};

type DocRow = {
  id: string;
  title: string | null;
  file_path: string;
  file_name: string;
  file_size: number | null;
  created_at: string;
  user_id: string | null;
  student_id: string | null;
  category: string | null;
  jotform_submission_id: string | null;
};

type CategoryKey = "admision" | "vacunas" | "certificado_medico" | "otros";

const CATEGORIES: { key: CategoryKey; label: string; icon: typeof FileText; color: string; bg: string }[] = [
  { key: "admision", label: "Solicitud de admisión", icon: FileSignature, color: "text-primary", bg: "bg-primary/10" },
  { key: "vacunas", label: "Vacunas", icon: Syringe, color: "text-leaf", bg: "bg-leaf/15" },
  { key: "certificado_medico", label: "Certificado médico", icon: HeartPulse, color: "text-accent", bg: "bg-accent/15" },
  { key: "otros", label: "Otros documentos", icon: Folder, color: "text-muted-foreground", bg: "bg-muted" },
];

const MAX_BYTES = 10 * 1024 * 1024;

const formatSize = (n: number | null) => {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

const AdminStudentDocuments = ({ adminUserId }: { adminUserId: string }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadingCat, setUploadingCat] = useState<CategoryKey | null>(null);
  const [titles, setTitles] = useState<Record<CategoryKey, string>>({
    admision: "", vacunas: "", certificado_medico: "", otros: "",
  });
  const inputRefs = useRef<Record<CategoryKey, HTMLInputElement | null>>({
    admision: null, vacunas: null, certificado_medico: null, otros: null,
  });

  const selected = useMemo(() => students.find((s) => s.id === selectedId) ?? null, [students, selectedId]);

  useEffect(() => {
    (async () => {
      setLoadingStudents(true);
      const { data, error } = await supabase
        .from("allowed_students")
        .select("id, student_number, student_name, group_name, parent_user_id")
        .eq("status", "active")
        .order("student_name", { ascending: true });
      setLoadingStudents(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      setStudents((data ?? []) as Student[]);
    })();
  }, []);

  const loadDocs = async (studentId: string) => {
    setLoadingDocs(true);
    const { data, error } = await supabase
      .from("parent_documents")
      .select("id, title, file_path, file_name, file_size, created_at, user_id, student_id, category, jotform_submission_id")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });
    setLoadingDocs(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setDocs((data ?? []) as DocRow[]);
  };

  useEffect(() => {
    if (selectedId) loadDocs(selectedId);
    else setDocs([]);
  }, [selectedId]);

  const handleUpload = async (category: CategoryKey, file: File) => {
    if (!selected) return;
    if (file.size > MAX_BYTES) {
      toast({ title: "Archivo muy grande", description: "Máximo 10 MB.", variant: "destructive" });
      return;
    }
    setUploadingCat(category);
    const ownerScope = selected.parent_user_id ?? "unassigned";
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
    const path = `students/${selected.id}/${category}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext ? "." + ext : ""}`;
    const { error: upErr } = await supabase.storage
      .from("parent-documents")
      .upload(path, file, { contentType: file.type || undefined });
    if (upErr) {
      setUploadingCat(null);
      toast({ title: "Error al subir", description: upErr.message, variant: "destructive" });
      return;
    }
    const { error: insErr } = await supabase.from("parent_documents").insert({
      user_id: selected.parent_user_id,
      document_type: "admin_assigned" as never,
      file_path: path,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
      uploaded_by: adminUserId,
      title: titles[category].trim() || CATEGORIES.find((c) => c.key === category)?.label || null,
      student_id: selected.id,
      category,
    } as never);
    setUploadingCat(null);
    if (insErr) {
      await supabase.storage.from("parent-documents").remove([path]);
      toast({ title: "Error", description: insErr.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Archivo guardado",
      description: selected.parent_user_id
        ? "Visible para el padre del estudiante."
        : `Guardado en el expediente (estudiante sin padre activado: ${ownerScope === "unassigned" ? "queda pendiente de mostrar" : ""}).`,
    });
    setTitles((t) => ({ ...t, [category]: "" }));
    loadDocs(selected.id);
  };

  const handleDownload = async (doc: DocRow) => {
    const { data, error } = await supabase.storage
      .from("parent-documents")
      .createSignedUrl(doc.file_path, 60);
    if (error || !data?.signedUrl) {
      toast({ title: "Error", description: error?.message ?? "No se pudo abrir.", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const handleDelete = async (doc: DocRow) => {
    if (!confirm(`¿Eliminar "${doc.title ?? doc.file_name}"?`)) return;
    await supabase.storage.from("parent-documents").remove([doc.file_path]);
    const { error } = await supabase.from("parent_documents").delete().eq("id", doc.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Eliminado" });
    if (selected) loadDocs(selected.id);
  };

  const docsByCat = useMemo(() => {
    const m: Record<string, DocRow[]> = {};
    for (const d of docs) {
      const k = d.category ?? "otros";
      (m[k] ||= []).push(d);
    }
    return m;
  }, [docs]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-bold text-ink text-lg mb-1">Expediente del estudiante</h3>
        <p className="text-sm text-muted-foreground">
          Selecciona un estudiante para ver y administrar su expediente: solicitud de admisión, vacunas, certificado médico y otros documentos.
          Si el padre ya activó su cuenta, los archivos aparecerán automáticamente en su portal.
        </p>
      </div>

      <div>
        <Label className="text-sm mb-1.5 block">Estudiante</Label>
        <Select value={selectedId} onValueChange={setSelectedId} disabled={loadingStudents}>
          <SelectTrigger>
            <SelectValue placeholder={loadingStudents ? "Cargando…" : "Selecciona un estudiante"} />
          </SelectTrigger>
          <SelectContent>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {(s.student_name ?? s.student_number)}
                {s.group_name ? ` · ${s.group_name}` : ""}
                {!s.parent_user_id ? " · (sin activar)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected && !selected.parent_user_id && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Este estudiante aún no ha activado su cuenta de padre. Puedes subir documentos al expediente; cuando el padre se registre con el número de estudiante, los archivos se vincularán automáticamente.
          </span>
        </div>
      )}

      {selected && (
        <div className="grid md:grid-cols-2 gap-4">
          {CATEGORIES.map(({ key, label, icon: Icon, color, bg }) => {
            const items = docsByCat[key] ?? [];
            const busy = uploadingCat === key;
            return (
              <Card key={key} className="p-4 rounded-2xl border-2 space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${bg} ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-ink">{label}</h4>
                  <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder={`Título (opcional, por defecto: ${label})`}
                    value={titles[key]}
                    onChange={(e) => setTitles((t) => ({ ...t, [key]: e.target.value }))}
                    maxLength={150}
                  />
                  <input
                    ref={(el) => { inputRefs.current[key] = el; }}
                    type="file"
                    accept="application/pdf,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(key, f);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={busy}
                    onClick={() => inputRefs.current[key]?.click()}
                  >
                    {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Subiendo…</> : <><Upload className="h-4 w-4" /> Subir archivo</>}
                  </Button>
                </div>

                <ul className="space-y-1.5">
                  {loadingDocs ? (
                    <li className="text-xs text-muted-foreground">Cargando…</li>
                  ) : items.length === 0 ? (
                    <li className="text-xs text-muted-foreground">Sin archivos.</li>
                  ) : (
                    items.map((d) => (
                      <li key={d.id} className="flex items-center gap-2 text-xs bg-muted/50 rounded-lg px-2 py-1.5">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-ink truncate">{d.title ?? d.file_name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {d.file_name}{d.file_size ? ` · ${formatSize(d.file_size)}` : ""}
                            {d.jotform_submission_id ? " · Jotform" : ""}
                          </p>
                        </div>
                        <button type="button" onClick={() => handleDownload(d)} className="p-1 hover:text-primary" title="Descargar">
                          <Download className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => handleDelete(d)} className="p-1 hover:text-destructive" title="Eliminar">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminStudentDocuments;
