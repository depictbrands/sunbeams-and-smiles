import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Session } from "@supabase/supabase-js";
import MessagesInbox from "@/components/MessagesInbox";
import ProfileEditor from "@/components/ProfileEditor";

const TeacherInbox = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isStaff, setIsStaff] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Bandeja de maestras | Sonsoles";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) checkStaff(s.user.id); else setIsStaff(null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) checkStaff(data.session.user.id); else setIsStaff(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkStaff = async (uid: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    const staff = (data ?? []).some((r) => r.role === "teacher" || r.role === "admin");
    setIsStaff(staff);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted">
      <div className="container py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-ink mb-8">
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/15 text-primary mb-4">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-4xl text-ink mb-2" style={{ fontFamily: "'ChildsPlayground', cursive" }}>
              Bandeja de maestras
            </h1>
            <p className="text-muted-foreground">Acceso solo para personal del preescolar.</p>
          </div>

          {!session ? (
            <Card className="p-8 rounded-3xl border-2 shadow-soft max-w-md mx-auto">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-2">Correo</label>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-2">Contraseña</label>
                  <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <Button type="submit" variant="hero" size="xl" className="w-full" disabled={loading}>
                  {loading ? "Ingresando…" : "Iniciar sesión"}
                </Button>
              </form>
            </Card>
          ) : isStaff === false ? (
            <Card className="p-8 rounded-3xl border-2 shadow-soft text-center max-w-md mx-auto">
              <p className="text-ink mb-4">Esta cuenta no tiene acceso de maestra.</p>
              <Button variant="outline" onClick={handleLogout}><LogOut className="h-4 w-4" /> Cerrar sesión</Button>
            </Card>
          ) : isStaff ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Maestra: <span className="font-semibold text-ink">{session.user.email}</span>
                </p>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" /> Salir
                </Button>
              </div>
              <ProfileEditor userId={session.user.id} />
              <MessagesInbox userId={session.user.id} isStaff={true} />
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Cargando…</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherInbox;
