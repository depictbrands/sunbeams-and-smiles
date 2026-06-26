import { useEffect, useState, useCallback } from "react";
import { Download, Printer, Upload, Trash2, Eye, EyeOff, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SchoolCalendar {
  id: string;
  title: string;
  year: number;
  file_path: string;
  is_active: boolean;
  created_at: string;
}

interface Props {
  isAdmin: boolean;
}

const BUCKET = "school-calendars";

const SchoolCalendarViewer = ({ isAdmin }: Props) => {
  const [calendars, setCalendars] = useState<SchoolCalendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newYear, setNewYear] = useState<number>(new Date().getFullYear());
  const [newFile, setNewFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("school_calendars")
      .select("*")
      .order("year", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error al cargar calendarios", description: error.message, variant: "destructive" });
    } else {
      const list = (data ?? []) as SchoolCalendar[];
      setCalendars(list);
      const first = list.find((c) => c.is_active) ?? list[0];
      if (first) setSelectedId(first.id);
      else setSelectedId(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const selected = calendars.find((c) => c.id === selectedId);
    if (!selected) { setSignedUrl(null); return; }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(selected.file_path, 60 * 60);
      if (cancelled) return;
      if (error) {
        toast({ title: "No se pudo abrir el PDF", description: error.message, variant: "destructive" });
        setSignedUrl(null);
      } else {
        setSignedUrl(data.signedUrl);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedId, calendars]);

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
    const ext = "pdf";
    const path = `${newYear}/${Date.now()}-${newTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.${ext}`;
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
    const { error: insErr } = await supabase.from("school_calendars").insert({
      title: newTitle.trim(),
      year: newYear,
      file_path: path,
      is_active: true,
      uploaded_by: userData.user?.id ?? null,
    });
    if (insErr) {
      toast({ title: "Error al guardar", description: insErr.message, variant: "destructive" });
    } else {
      toast({ title: "Calendario subido" });
      setNewTitle("");
      setNewFile(null);
      await load();
    }
    setUploading(false);
  };

  const toggleActive = async (c: SchoolCalendar) => {
    const { error } = await supabase
      .from("school_calendars")
      .update({ is_active: !c.is_active })
      .eq("id", c.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else load();
  };

  const remove = async (c: SchoolCalendar) => {
    if (!confirm(`¿Eliminar "${c.title}"?`)) return;
    await supabase.storage.from(BUCKET).remove([c.file_path]);
    const { error } = await supabase.from("school_calendars").delete().eq("id", c.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Eliminado" }); load(); }
  };

  const handlePrint = () => {
    if (!signedUrl) return;
    const w = window.open(signedUrl, "_blank");
    if (w) setTimeout(() => { try { w.print(); } catch { /* noop */ } }, 800);
  };

  const visibleList = isAdmin ? calendars : calendars.filter((c) => c.is_active);
  const selected = calendars.find((c) => c.id === selectedId);

  return (
    <div className="space-y-4">
      {visibleList.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {visibleList.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                selectedId === c.id
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {c.title} · {c.year}
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
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">
            {isAdmin ? "Aún no hay calendarios. Sube uno abajo." : "Aún no hay calendario disponible."}
          </p>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-ink text-lg">{selected.title}</h3>
              <p className="text-sm text-muted-foreground">Año {selected.year}</p>
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
              <iframe
                src={signedUrl}
                title={selected.title}
                className="w-full h-[70vh]"
              />
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
            <Upload className="h-4 w-4" /> Subir nuevo calendario
          </h4>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Label htmlFor="cal-title">Título</Label>
              <Input
                id="cal-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Calendario Verano 2026"
              />
            </div>
            <div>
              <Label htmlFor="cal-year">Año</Label>
              <Input
                id="cal-year"
                type="number"
                value={newYear}
                onChange={(e) => setNewYear(parseInt(e.target.value || "0", 10))}
              />
            </div>
            <div className="sm:col-span-3">
              <Label htmlFor="cal-file">Archivo PDF</Label>
              <Input
                id="cal-file"
                type="file"
                accept="application/pdf"
                onChange={(e) => setNewFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleUpload} disabled={uploading} className="rounded-full">
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Subir calendario
            </Button>
          </div>

          {calendars.length > 0 && (
            <div className="mt-5 pt-5 border-t">
              <h5 className="font-semibold text-sm mb-2">Calendarios cargados</h5>
              <ul className="divide-y">
                {calendars.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2 gap-2">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Año {c.year} · {c.is_active ? "Activo" : "Inactivo"}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(c)}>
                        {c.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(c)}>
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

export default SchoolCalendarViewer;
