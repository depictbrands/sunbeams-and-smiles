import { useEffect, useMemo, useState } from "react";
import { FileText, Download, FileSignature, Syringe, HeartPulse, Folder, Pill, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type DocRow = {
  id: string;
  document_type: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  created_at: string;
  title: string | null;
  category: string | null;
};

const CATEGORIES: { key: string; label: string; icon: typeof FileText; color: string; bg: string }[] = [
  { key: "admision", label: "Solicitud de admisión", icon: FileSignature, color: "text-primary", bg: "bg-primary/10" },
  { key: "medicamentos", label: "Autorización de medicamentos", icon: Pill, color: "text-azure", bg: "bg-azure/15" },
  { key: "vacunas", label: "Vacunas", icon: Syringe, color: "text-leaf", bg: "bg-leaf/15" },
  { key: "certificado_medico", label: "Certificado médico", icon: HeartPulse, color: "text-accent", bg: "bg-accent/15" },
  { key: "otros", label: "Otros documentos", icon: Folder, color: "text-muted-foreground", bg: "bg-muted" },
];

const formatSize = (n: number | null) => {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

const ParentDocumentUploads = ({ userId }: { userId: string }) => {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("parent_documents")
      .select("id, document_type, file_path, file_name, file_size, created_at, title, category")
      .eq("user_id", userId)
      .eq("document_type", "admin_assigned")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setDocs((data ?? []) as DocRow[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [userId]);

  const grouped = useMemo(() => {
    const m: Record<string, DocRow[]> = {};
    for (const d of docs) {
      const k = d.category ?? "otros";
      (m[k] ||= []).push(d);
    }
    return m;
  }, [docs]);

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

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-ink text-lg mb-1">Expediente de tu hijo/a</h3>
        <p className="text-sm text-muted-foreground">
          Documentos que el preescolar ha guardado en el expediente.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay documentos en el expediente.</p>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.map(({ key, label, icon: Icon, color, bg }) => {
            const items = grouped[key] ?? [];
            if (items.length === 0) return null;
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${bg} ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-ink text-sm">{label}</h4>
                </div>
                <ul className="space-y-2">
                  {items.map((d) => (
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
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ParentDocumentUploads;
