import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Trash2, Download, Loader2, AlertCircle } from "lucide-react";
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
  user_id: string;
  student_id: string | null;
};

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
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selected = useMemo(() => students.find((s) => s.id === selectedId) ?? null, [students, selectedId]);

  useEffect(() => {
    (async () => {
      setLoadingStudents(true);
      const { data, error } = await supabase
        .from("allowed_students")
        .select("id, student_number, student_name, group_name, parent_user_id")
        .eq("status", "active")
        .not("parent_user_id", "is", null)
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
      .select("id, title, file_path, file_name, file_size, created_at, user_id, student_id")
      .eq("student_id", studentId)
      .eq("document_type", "admin_assigned")
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

  const handleUpload = async (file: File) => {
    if (!selected) return;
    if (!selected.parent_user_id) {
      toast({
        title: "Estudiante sin padre vinculado",
        description: "El padre debe crear su cuenta para que pueda ver el archivo.",
        variant: "destructive",
      });
      return;
    }
    if (!title.trim()) {
      toast({ title: "Falta el título", description: "Escribe un nombre para el documento.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({ title: "Archivo muy grande", description: "Máximo 10 MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
    const path = `${selected.parent_user_id}/admin/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext ? "." + ext : ""}`;
    const { error: upErr } = await supabase.storage
      .from("parent-documents")
      .upload(path, file, { contentType: file.type || undefined });
    if (upErr) {
      setUploading(false);
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
      title: title.trim(),
      student_id: selected.id,
    } as never);
    setUploading(false);
    if (insErr) {
      await supabase.storage.from("parent-documents").remove([path]);
      toast({ title: "Error", description: insErr.message, variant: "destructive" });
      return;
    }
    toast({ title: "Archivo asignado", description: `${file.name} → ${selected.student_name ?? selected.student_number}` });
    setTitle("");
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

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-bold text-ink text-lg mb-1">Asignar documentos por estudiante</h3>
        <p className="text-sm text-muted-foreground">
          Sube archivos (PDF o imágenes, máx. 10 MB) para un estudiante. El padre vinculado los verá en su sección de Formularios.
        </p>
      </div>

      <div className="grid gap-3">
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
                  {!s.parent_user_id ? " · (sin padre vinculado)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selected && !selected.parent_user_id && (
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Este estudiante aún no tiene un padre vinculado. El padre debe registrarse con su número de estudiante antes de poder ver los archivos.</span>
          </div>
        )}

        {selected && (
          <Card className="p-4 rounded-2xl border-2 space-y-3">
            <div>
              <Label className="text-sm mb-1.5 block">Título del documento</Label>
              <Input
                placeholder="Ej. Solicitud de Admisión"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={150}
              />
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="hero"
              disabled={uploading || !selected.parent_user_id}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Subiendo…</>
              ) : (
                <><Upload className="h-4 w-4" /> Subir y asignar</>
              )}
            </Button>
          </Card>
        )}
      </div>

      {selected && (
        <div>
          <h4 className="font-bold text-ink text-sm mb-2">Archivos asignados</h4>
          {loadingDocs ? (
            <p className="text-xs text-muted-foreground">Cargando…</p>
          ) : docs.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin archivos para este estudiante.</p>
          ) : (
            <ul className="space-y-2">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink truncate">{d.title ?? d.file_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {d.file_name}{d.file_size ? ` · ${formatSize(d.file_size)}` : ""}
                    </p>
                  </div>
                  <button type="button" onClick={() => handleDownload(d)} className="p-1.5 hover:text-primary" title="Descargar">
                    <Download className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => handleDelete(d)} className="p-1.5 hover:text-destructive" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminStudentDocuments;
