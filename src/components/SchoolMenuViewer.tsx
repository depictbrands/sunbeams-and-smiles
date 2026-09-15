import { useEffect, useState, useCallback } from "react";
import { Download, Printer, Upload, Trash2, Eye, EyeOff, Loader2, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SchoolMenu {
  id: string;
  title: string;
  period: string | null;
  file_path: string;
  is_active: boolean;
  created_at: string;
}

interface Props {
  isAdmin: boolean;
}

const BUCKET = "school-menus";

const SchoolMenuViewer = ({ isAdmin }: Props) => {
  const [menus, setMenus] = useState<SchoolMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPeriod, setNewPeriod] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("school_menus")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error al cargar menús", description: error.message, variant: "destructive" });
    } else {
      const list = (data ?? []) as SchoolMenu[];
      setMenus(list);
      const first = list.find((m) => m.is_active) ?? list[0];
      setSelectedId(first ? first.id : null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const selected = menus.find((m) => m.id === selectedId);
    if (!selected) {
      setSignedUrl(null);
      return;
    }
    let cancelled = false;
    let createdBlobUrl: string | null = null;
    (async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(selected.file_path, 60 * 60);
      if (cancelled) return;
      if (error || !data) {
        toast({ title: "No se pudo abrir el PDF", description: error?.message ?? "Error", variant: "destructive" });
        setSignedUrl(null);
        return;
      }
      try {
        const res = await fetch(data.signedUrl);
        const blob = await res.blob();
        if (cancelled) return;
        createdBlobUrl = URL.createObjectURL(blob);
        setSignedUrl(createdBlobUrl);
      } catch {
        if (!cancelled) setSignedUrl(data.signedUrl);
      }
    })();
    return () => {
      cancelled = true;
      if (createdBlobUrl) URL.revokeObjectURL(createdBlobUrl);
    };
  }, [selectedId, menus]);

  const handleUpload = async () => {
    if (!newFile || !newTitle.trim()) {
      toast({ title: "Faltan datos", description: "Agrega título y archivo PDF.", variant: "destructive" });
      return;
    }
    if (newFile.type !== "application/pdf") {
      toast({ title: "Solo PDF", description: "El archivo debe ser un PDF.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const slug = newTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const path = `${new Date().getFullYear()}/${Date.now()}-${slug}.pdf`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, newFile, {
      contentType: "application/pdf",
      upsert: false,
    });
    if (upErr) {
      toast({ title: "Error al subir", description: upErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const { error: insErr } = await supabase.from("school_menus").insert({
      title: newTitle.trim(),
      period: newPeriod.trim() || null,
      file_path: path,
      is_active: true,
      uploaded_by: userData.user?.id ?? null,
    });
    if (insErr) {
      toast({ title: "Error al guardar", description: insErr.message, variant: "destructive" });
    } else {
      toast({ title: "Menú subido" });
      setNewTitle("");
      setNewPeriod("");
      setNewFile(null);
      await load();
    }
    setUploading(false);
  };

  const toggleActive = async (m: SchoolMenu) => {
    const { error } = await supabase.from("school_menus").update({ is_active: !m.is_active }).eq("id", m.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else load();
  };

  const remove = async (m: SchoolMenu) => {
    if (!confirm(`¿Eliminar "${m.title}"?`)) return;
    await supabase.storage.from(BUCKET).remove([m.file_path]);
    const { error } = await supabase.from("school_menus").delete().eq("id", m.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Eliminado" });
      load();
    }
  };

  const handlePrint = () => {
    if (!signedUrl) return;
    const w = window.open(signedUrl, "_blank");
    if (w) setTimeout(() => { try { w.print(); } catch { /* noop */ } }, 800);
  };

  const visibleList = isAdmin ? menus : menus.filter((m) => m.is_active);
  const selected = menus.find((m) => m.id === selectedId);

  return (
    <div className="space-y-4">
      {visibleList.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {visibleList.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedId(m.id)}
              className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                selectedId === m.id
                  ? "border-destructive bg-destructive/10 text-destructive font-semibold"
                  : "border-border hover:border-destructive/50"
              }`}
            >
              {m.title}
              {m.period ? ` · ${m.period}` : ""}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !selected ? (
        <Card className="p-8 text-center rounded-2xl border-2 border-dashed">
          <Apple className="h-10 w-10 mx-auto mb-3 text-destructive" />
          <p className="text-muted-foreground">
            {isAdmin ? "Aún no hay menús. Sube uno abajo." : "El menú estará disponible próximamente."}
          </p>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-ink text-lg">{selected.title}</h3>
              {selected.period && <p className="text-sm text-muted-foreground">{selected.period}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {signedUrl && (
                <>
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <a href={signedUrl} download={`${selected.title}.pdf`}>
                      <Download className="h-4 w-4 mr-1.5" /> Descargar
                    </a>
                  </Button>
                  <Button onClick={handlePrint} variant="outline" size="sm" className="rounded-full">
                    <Printer className="h-4 w-4 mr-1.5" /> Imprimir
                  </Button>
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                      Abrir en pestaña
                    </a>
                  </Button>
                </>
              )}
            </div>
          </div>

          {signedUrl ? (
            <div className="w-full rounded-2xl overflow-hidden border-2 bg-muted">
              <iframe src={signedUrl} title={selected.title} className="w-full h-[70vh]" />
            </div>
          ) : (
            <div className="h-[60vh] flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      )}

      {isAdmin && (
        <Card className="p-5 rounded-2xl border-2 mt-6">
          <h4 className="font-bold text-ink mb-3 flex items-center gap-2">
            <Upload className="h-4 w-4" /> Subir nuevo menú
          </h4>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="menu-title">Título</Label>
              <Input
                id="menu-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Menú escolar"
              />
            </div>
            <div>
              <Label htmlFor="menu-period">Periodo (opcional)</Label>
              <Input
                id="menu-period"
                value={newPeriod}
                onChange={(e) => setNewPeriod(e.target.value)}
                placeholder="2025-2027"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="menu-file">Archivo PDF</Label>
              <Input
                id="menu-file"
                type="file"
                accept="application/pdf"
                onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleUpload} disabled={uploading} className="rounded-full">
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Subir menú
            </Button>
          </div>

          {menus.length > 0 && (
            <div className="mt-5 pt-5 border-t">
              <h5 className="font-semibold text-sm mb-2">Menús cargados</h5>
              <ul className="divide-y">
                {menus.map((m) => (
                  <li key={m.id} className="flex items-center justify-between py-2 gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{m.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.period ? `${m.period} · ` : ""}
                        {m.is_active ? "Activo" : "Inactivo"}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(m)}>
                        {m.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(m)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default SchoolMenuViewer;
