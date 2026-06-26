import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Syringe, HeartPulse, Trash2, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type DocType = "documentos_anuales" | "vacunas" | "certificado_salud" | "admin_assigned";

type DocRow = {
  id: string;
  document_type: DocType;
  file_path: string;
  file_name: string;
  file_size: number | null;
  created_at: string;
  title: string | null;
};

const TYPES: { key: DocType; label: string; icon: typeof FileText; color: string; bg: string }[] = [
  { key: "vacunas", label: "Vacunas", icon: Syringe, color: "text-leaf", bg: "bg-leaf/15" },
  { key: "certificado_salud", label: "Certificado de Salud", icon: HeartPulse, color: "text-accent", bg: "bg-accent/15" },
];

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const formatSize = (n: number | null) => {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

const ParentDocumentUploads = ({ userId }: { userId: string }) => {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<DocType | null>(null);
  const inputRefs = useRef<Record<DocType, HTMLInputElement | null>>({
    documentos_anuales: null,
    vacunas: null,
    certificado_salud: null,
    admin_assigned: null,
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("parent_documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setDocs((data ?? []) as DocRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleUpload = async (type: DocType, file: File) => {
    if (file.size > MAX_BYTES) {
      toast({ title: "Archivo muy grande", description: "Máximo 10 MB.", variant: "destructive" });
      return;
    }
    setUploadingType(type);
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "";
    const path = `${userId}/${type}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext ? "." + ext : ""}`;
    const { error: upErr } = await supabase.storage
      .from("parent-documents")
      .upload(path, file, { contentType: file.type || undefined });
    if (upErr) {
      setUploadingType(null);
      toast({ title: "Error al subir", description: upErr.message, variant: "destructive" });
      return;
    }
    const { error: insErr } = await supabase.from("parent_documents").insert({
      user_id: userId,
      document_type: type,
      file_path: path,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type || null,
    });
    setUploadingType(null);
    if (insErr) {
      await supabase.storage.from("parent-documents").remove([path]);
      toast({ title: "Error", description: insErr.message, variant: "destructive" });
      return;
    }
    toast({ title: "Archivo subido", description: file.name });
    load();
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
    if (!confirm(`¿Eliminar "${doc.file_name}"?`)) return;
    const { error: sErr } = await supabase.storage.from("parent-documents").remove([doc.file_path]);
    if (sErr) {
      toast({ title: "Error", description: sErr.message, variant: "destructive" });
      return;
    }
    const { error: dErr } = await supabase.from("parent_documents").delete().eq("id", doc.id);
    if (dErr) {
      toast({ title: "Error", description: dErr.message, variant: "destructive" });
      return;
    }
    toast({ title: "Eliminado" });
    load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-ink text-lg mb-1">Subir documentos del estudiante</h3>
        <p className="text-sm text-muted-foreground">
          Sube archivos PDF o imágenes (máx. 10 MB). Solo tú y el personal del preescolar podrán verlos.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {TYPES.map(({ key, label, icon: Icon, color, bg }) => {
          const items = docs.filter((d) => d.document_type === key);
          const busy = uploadingType === key;
          return (
            <Card key={key} className="p-4 rounded-2xl border-2 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${bg} ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-ink text-sm">{label}</h4>
              </div>

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
                className="w-full mb-3"
                disabled={busy}
                onClick={() => inputRefs.current[key]?.click()}
              >
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Subiendo…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Subir archivo
                  </>
                )}
              </Button>

              <div className="space-y-1.5 flex-1">
                {loading ? (
                  <p className="text-xs text-muted-foreground">Cargando…</p>
                ) : items.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sin archivos.</p>
                ) : (
                  items.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center gap-1.5 text-xs bg-muted/50 rounded-lg px-2 py-1.5"
                    >
                      <span className="flex-1 truncate" title={d.file_name}>
                        {d.file_name}
                        {d.file_size ? (
                          <span className="text-muted-foreground"> · {formatSize(d.file_size)}</span>
                        ) : null}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownload(d)}
                        className="p-1 hover:text-primary"
                        title="Descargar"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(d)}
                        className="p-1 hover:text-destructive"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {(() => {
        const assigned = docs.filter((d) => d.document_type === "admin_assigned");
        if (assigned.length === 0) return null;
        return (
          <div className="pt-4 border-t">
            <h3 className="font-bold text-ink text-lg mb-1">Documentos del preescolar</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Archivos que el preescolar te asignó para tu hijo/a.
            </p>
            <ul className="space-y-2">
              {assigned.map((d) => (
                <li key={d.id} className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink truncate">{d.title ?? d.file_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {d.file_name}{d.file_size ? ` · ${formatSize(d.file_size)}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownload(d)}
                    className="p-1.5 hover:text-primary"
                    title="Descargar"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}
    </div>
  );
};

export default ParentDocumentUploads;
