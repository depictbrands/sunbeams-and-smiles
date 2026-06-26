import { useEffect, useState, useCallback } from "react";
import {
  Download, Upload, Trash2, Eye, EyeOff, Loader2, FileText, Pin, PinOff, Pencil, Plus, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Announcement {
  id: string;
  title: string;
  content: string | null;
  category: string;
  audience_group: string;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_mime: string | null;
  published_at: string;
  pinned: boolean;
  is_active: boolean;
  created_at: string;
}

interface Props {
  isAdmin: boolean;
}

const BUCKET = "announcement-files";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "recordatorio", label: "Recordatorio" },
  { value: "evento", label: "Evento" },
  { value: "academico", label: "Académico" },
  { value: "urgente", label: "Urgente" },
];

const GROUPS = [
  { value: "all", label: "Todos los grupos" },
  { value: "maternal", label: "Maternal" },
  { value: "preescolar", label: "Preescolar" },
  { value: "prekinder", label: "Pre-Kínder" },
];

const groupColor = (g: string) => {
  switch (g) {
    case "maternal": return "bg-pink-100 text-pink-700 border-pink-200";
    case "preescolar": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "prekinder": return "bg-sky-100 text-sky-700 border-sky-200";
    default: return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const categoryColor = (cat: string) => {
  switch (cat) {
    case "urgente": return "bg-red-100 text-red-700 border-red-200";
    case "evento": return "bg-blue-100 text-blue-700 border-blue-200";
    case "academico": return "bg-violet-100 text-violet-700 border-violet-200";
    case "recordatorio": return "bg-amber-100 text-amber-700 border-amber-200";
    default: return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PR", { year: "numeric", month: "long", day: "numeric" });

const AnnouncementsViewer = ({ isAdmin }: Props) => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");

  // Editor state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fTitle, setFTitle] = useState("");
  const [fContent, setFContent] = useState("");
  const [fCategory, setFCategory] = useState("general");
  const [fGroup, setFGroup] = useState("all");
  const [fPinned, setFPinned] = useState(false);
  const [fFile, setFFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("pinned", { ascending: false })
      .order("published_at", { ascending: false });
    if (error) {
      toast({ title: "Error al cargar anuncios", description: error.message, variant: "destructive" });
    } else {
      setItems((data ?? []) as Announcement[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const paths = items.filter((i) => i.attachment_path).map((i) => i.attachment_path!) as string[];
      if (paths.length === 0) { setSignedUrls({}); return; }
      const map: Record<string, string> = {};
      await Promise.all(paths.map(async (p) => {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(p, 60 * 60);
        if (data?.signedUrl) map[p] = data.signedUrl;
      }));
      if (!cancelled) setSignedUrls(map);
    })();
    return () => { cancelled = true; };
  }, [items]);

  const resetForm = () => {
    setEditingId(null);
    setFTitle(""); setFContent(""); setFCategory("general");
    setFPinned(false); setFFile(null);
  };

  const startEdit = (a: Announcement) => {
    setEditingId(a.id);
    setFTitle(a.title);
    setFContent(a.content ?? "");
    setFCategory(a.category);
    setFPinned(a.pinned);
    setFFile(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!fTitle.trim()) {
      toast({ title: "Falta título", variant: "destructive" });
      return;
    }
    setSaving(true);
    let attachment_path: string | null | undefined = undefined;
    let attachment_name: string | null | undefined = undefined;
    let attachment_mime: string | null | undefined = undefined;

    if (fFile) {
      const safe = fFile.name.replace(/[^a-z0-9._-]+/gi, "-");
      const path = `${new Date().getFullYear()}/${Date.now()}-${safe}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, fFile, {
        contentType: fFile.type || undefined,
        upsert: false,
      });
      if (upErr) {
        toast({ title: "Error al subir archivo", description: upErr.message, variant: "destructive" });
        setSaving(false);
        return;
      }
      attachment_path = path;
      attachment_name = fFile.name;
      attachment_mime = fFile.type || null;
    }

    if (editingId) {
      const update: {
        title: string; content: string | null; category: string; pinned: boolean;
        attachment_path?: string | null; attachment_name?: string | null; attachment_mime?: string | null;
      } = {
        title: fTitle.trim(), content: fContent.trim() || null,
        category: fCategory, pinned: fPinned,
      };
      if (attachment_path !== undefined) {
        update.attachment_path = attachment_path ?? null;
        update.attachment_name = attachment_name ?? null;
        update.attachment_mime = attachment_mime ?? null;
      }
      const { error } = await supabase.from("announcements").update(update).eq("id", editingId);
      if (error) toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
      else { toast({ title: "Anuncio actualizado" }); resetForm(); setShowForm(false); await load(); }
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("announcements").insert({
        title: fTitle.trim(),
        content: fContent.trim() || null,
        category: fCategory,
        pinned: fPinned,
        is_active: true,
        attachment_path: attachment_path ?? null,
        attachment_name: attachment_name ?? null,
        attachment_mime: attachment_mime ?? null,
        created_by: userData.user?.id ?? null,
      });
      if (error) toast({ title: "Error al crear", description: error.message, variant: "destructive" });
      else { toast({ title: "Anuncio publicado" }); resetForm(); setShowForm(false); await load(); }
    }
    setSaving(false);
  };

  const toggleActive = async (a: Announcement) => {
    const { error } = await supabase.from("announcements").update({ is_active: !a.is_active }).eq("id", a.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else load();
  };

  const togglePin = async (a: Announcement) => {
    const { error } = await supabase.from("announcements").update({ pinned: !a.pinned }).eq("id", a.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else load();
  };

  const remove = async (a: Announcement) => {
    if (!confirm(`¿Eliminar "${a.title}"?`)) return;
    if (a.attachment_path) {
      await supabase.storage.from(BUCKET).remove([a.attachment_path]);
    }
    const { error } = await supabase.from("announcements").delete().eq("id", a.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Eliminado" }); load(); }
  };

  const visibleItems = (isAdmin ? items : items.filter((i) => i.is_active))
    .filter((i) => filter === "all" || i.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
              filter === "all" ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border hover:border-primary/50"
            }`}
          >
            Todos
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setFilter(c.value)}
              className={`px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                filter === c.value ? "border-primary bg-primary/10 text-primary font-semibold" : "border-border hover:border-primary/50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {isAdmin && (
          <Button
            onClick={() => { if (showForm) { resetForm(); } setShowForm((v) => !v); }}
            size="sm"
            className="rounded-full"
          >
            {showForm ? <><X className="h-4 w-4 mr-1.5" /> Cerrar</> : <><Plus className="h-4 w-4 mr-1.5" /> Nuevo anuncio</>}
          </Button>
        )}
      </div>

      {isAdmin && showForm && (
        <Card className="p-5 rounded-2xl border-2">
          <h4 className="font-bold text-ink mb-3">
            {editingId ? "Editar anuncio" : "Nuevo anuncio"}
          </h4>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="an-title">Título</Label>
              <Input id="an-title" value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Carta de inicio escolar" />
            </div>
            <div>
              <Label htmlFor="an-content">Contenido</Label>
              <Textarea id="an-content" value={fContent} onChange={(e) => setFContent(e.target.value)} rows={4} placeholder="Mensaje para los padres..." />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="an-cat">Categoría</Label>
                <select
                  id="an-cat"
                  value={fCategory}
                  onChange={(e) => setFCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border bg-background"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={fPinned} onChange={(e) => setFPinned(e.target.checked)} />
                  <span className="text-sm">Fijar arriba</span>
                </label>
              </div>
            </div>
            <div>
              <Label htmlFor="an-file">Adjunto (PDF o imagen, opcional)</Label>
              <Input
                id="an-file"
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setFFile(e.target.files?.[0] ?? null)}
              />
              {editingId && !fFile && (
                <p className="text-xs text-muted-foreground mt-1">Deja vacío para mantener el adjunto actual.</p>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => { resetForm(); setShowForm(false); }} className="rounded-full">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="rounded-full">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {editingId ? "Guardar cambios" : "Publicar"}
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : visibleItems.length === 0 ? (
        <Card className="p-8 text-center rounded-2xl border-2 border-dashed">
          <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No hay anuncios para mostrar.</p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {visibleItems.map((a) => {
            const url = a.attachment_path ? signedUrls[a.attachment_path] : null;
            const isImage = a.attachment_mime?.startsWith("image/");
            return (
              <li key={a.id}>
                <Card className={`p-5 rounded-2xl border-2 ${a.pinned ? "border-primary/50 bg-primary/5" : ""} ${!a.is_active ? "opacity-60" : ""}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {a.pinned && <Pin className="h-4 w-4 text-primary" />}
                        <h3 className="font-bold text-ink text-lg">{a.title}</h3>
                        <Badge variant="outline" className={`text-xs ${categoryColor(a.category)}`}>
                          {CATEGORIES.find((c) => c.value === a.category)?.label ?? a.category}
                        </Badge>
                        {!a.is_active && <Badge variant="outline" className="text-xs">Inactivo</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{fmtDate(a.published_at)}</p>
                      {a.content && (
                        <p className="text-sm text-foreground whitespace-pre-wrap">{a.content}</p>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => togglePin(a)} title={a.pinned ? "Desfijar" : "Fijar"}>
                          {a.pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => toggleActive(a)} title={a.is_active ? "Desactivar" : "Activar"}>
                          {a.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => startEdit(a)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => remove(a)} title="Eliminar">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {a.attachment_path && url && (
                    <div className="mt-3">
                      {isImage ? (
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt={a.attachment_name ?? ""} className="max-h-64 rounded-xl border" />
                        </a>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <Button asChild variant="outline" size="sm" className="rounded-full">
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4 mr-1.5" />
                              {a.attachment_name ?? "Ver adjunto"}
                            </a>
                          </Button>
                          <Button asChild variant="outline" size="sm" className="rounded-full">
                            <a href={url} download={a.attachment_name ?? undefined}>
                              <Download className="h-4 w-4 mr-1.5" /> Descargar
                            </a>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AnnouncementsViewer;
