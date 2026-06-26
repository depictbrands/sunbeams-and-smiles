import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Upload, Trash2, ShieldCheck, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Session } from "@supabase/supabase-js";

type Student = {
  id: string;
  student_number: string;
  student_name: string | null;
  status: "active" | "inactive";
  group_name: string | null;
  parent_user_id: string | null;
  created_at: string;
};

const GROUPS = ["Maternal", "Preescolar", "PreKinder"] as const;

const AdminStudents = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.title = "Estudiantes | Admin Sonsoles";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) checkAdmin(s.user.id); else { setIsAdmin(null); navigate("/portal-padres"); }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) checkAdmin(data.session.user.id);
      else navigate("/portal-padres");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkAdmin = async (uid: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    const admin = (data ?? []).some((r) => r.role === "admin");
    setIsAdmin(admin);
    if (admin) loadStudents();
  };

  const loadStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("allowed_students")
      .select("id, student_number, student_name, status, group_name, parent_user_id, created_at")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setStudents((data ?? []) as unknown as Student[]);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const number = newNumber.trim();
    const name = newName.trim();
    if (!number || !name) return;
    const { error } = await supabase
      .from("allowed_students")
      .insert({ student_number: number, student_name: name, group_name: newGroup || null } as never);
    if (error) {
      toast({ title: "No se pudo agregar", description: error.message, variant: "destructive" });
      return;
    }
    setNewNumber("");
    setNewName("");
    setNewGroup("");
    toast({ title: "Estudiante agregado" });
    loadStudents();
  };

  const handleUpdateName = async (s: Student, name: string) => {
    if (name === (s.student_name ?? "")) return;
    const { error } = await supabase
      .from("allowed_students")
      .update({ student_name: name } as never)
      .eq("id", s.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else loadStudents();
  };

  const handleUpdateNumber = async (s: Student, number: string) => {
    const n = number.trim();
    if (!n || n === s.student_number) return;
    const { error } = await supabase
      .from("allowed_students")
      .update({ student_number: n } as never)
      .eq("id", s.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else loadStudents();
  };

  const handleToggleStatus = async (s: Student) => {
    const next = s.status === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("allowed_students")
      .update({ status: next } as never)
      .eq("id", s.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else loadStudents();
  };

  const normalizeGroup = (v?: string | null): string | null => {
    if (!v) return null;
    const t = v.trim().toLowerCase();
    if (!t) return null;
    if (t.startsWith("mater")) return "Maternal";
    if (t.startsWith("prees")) return "Preescolar";
    if (t.startsWith("prek")) return "PreKinder";
    return null;
  };

  const handleUpdateGroup = async (s: Student, group: string) => {
    const value = group === "__none__" ? null : group;
    const { error } = await supabase
      .from("allowed_students")
      .update({ group_name: value } as never)
      .eq("id", s.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else loadStudents();
  };

  const handleDelete = async (s: Student) => {
    if (!confirm(`Eliminar al estudiante ${s.student_name ?? s.student_number}? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from("allowed_students").delete().eq("id", s.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else loadStudents();
  };

  const handleCsvUpload = async (file: File) => {
    const text = await file.text().then((t) => t.replace(/^\uFEFF/, ""));
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const first = lines[0].toLowerCase();
    const hasHeader = first.includes("student") || first.includes("number") || first.includes("nombre") || first.includes("numero") || first.includes("id");
    const rows = (hasHeader ? lines.slice(1) : lines)
      .map((line) => {
        const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const third = cols[2] ?? "";
        const group = normalizeGroup(third);
        const status = third.toLowerCase() === "inactive" ? "inactive" : "active";
        return { student_number: cols[0], student_name: cols[1] ?? null, status, group_name: group };
      })
      .filter((r) => r.student_number);

    if (!rows.length) {
      toast({ title: "CSV vacío", description: "No se encontraron filas válidas.", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("allowed_students")
      .upsert(rows as never, { onConflict: "student_number" });
    if (error) {
      toast({ title: "Error al importar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Importado", description: `${rows.length} estudiante(s) procesados.` });
    loadStudents();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.student_number.toLowerCase().includes(q) ||
        (s.student_name ?? "").toLowerCase().includes(q),
    );
  }, [students, search]);

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Cargando…</div>;
  }
  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-8 rounded-3xl border-2 max-w-md text-center">
          <p className="text-ink mb-4">Solo los administradores pueden gestionar estudiantes.</p>
          <Button variant="outline" onClick={() => navigate("/admin/mensajes")}>Volver</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="container py-10">
        <Link to="/admin/mensajes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-ink mb-8">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>

        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/15 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl text-ink" style={{ fontFamily: "'ChildsPlayground', cursive" }}>
                Estudiantes
              </h1>
              <p className="text-sm text-muted-foreground">
                Gestiona los IDs de estudiantes activos. Solo los administradores ven esta información.
              </p>
            </div>
          </div>

          <Card className="p-6 rounded-2xl border-2 mb-6">
            <h2 className="font-bold text-ink mb-3">Agregar estudiante</h2>
            <form onSubmit={handleAdd} className="grid sm:grid-cols-[160px_1fr_160px_auto] gap-3">
              <Input
                placeholder="ID (p. ej. 2026-014)"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                maxLength={50}
              />
              <Input
                placeholder="Nombre completo del estudiante"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={150}
              />
              <Select value={newGroup} onValueChange={setNewGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Grupo" />
                </SelectTrigger>
                <SelectContent>
                  {GROUPS.map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" variant="hero">
                <Plus className="h-4 w-4" /> Agregar
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm font-medium text-ink cursor-pointer">
                <Upload className="h-4 w-4" />
                Importar CSV
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleCsvUpload(f);
                    e.target.value = "";
                  }}
                />
              </label>
              <span className="text-xs text-muted-foreground">
                Columnas: <code>numero, nombre, grupo</code> (grupo: Maternal / Preescolar / PreKinder, o "inactive" para desactivar).
              </span>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border-2">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <h2 className="font-bold text-ink">Listado ({students.length})</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID o nombre"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Padre vinculado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <Input
                            defaultValue={s.student_number}
                            onBlur={(e) => handleUpdateNumber(s, e.target.value)}
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            defaultValue={s.student_name ?? ""}
                            onBlur={(e) => handleUpdateName(s, e.target.value)}
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={s.group_name ?? "__none__"}
                            onValueChange={(v) => handleUpdateGroup(s, v)}
                          >
                            <SelectTrigger className="h-9 w-[140px]">
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">—</SelectItem>
                              {GROUPS.map((g) => (
                                <SelectItem key={g} value={g}>{g}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.status === "active" ? "default" : "secondary"}>
                            {s.status === "active" ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {s.parent_user_id ? "Sí" : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleToggleStatus(s)}>
                              {s.status === "active" ? "Desactivar" : "Activar"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(s)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          Sin estudiantes.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminStudents;
