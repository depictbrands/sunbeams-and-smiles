import { useEffect, useState } from "react";
import { FileText, Download } from "lucide-react";
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
};

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
      .select("*")
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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
    <div className="space-y-3">
      <div>
        <h3 className="font-bold text-ink text-lg mb-1">Documentos del preescolar</h3>
        <p className="text-sm text-muted-foreground">
          Archivos que el preescolar asignó para tu hijo/a.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando…</p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aún no hay documentos asignados. Cuando el preescolar suba un archivo aparecerá aquí.
        </p>
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
      )}
    </div>
  );
};

export default ParentDocumentUploads;
