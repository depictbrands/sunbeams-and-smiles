import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ArrowLeft, CreditCard, Calendar, FileText, Megaphone, MessageCircle, LogOut, UserPlus, LogIn, Receipt, ExternalLink, ClipboardList, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Session } from "@supabase/supabase-js";
import MessagesInbox from "@/components/MessagesInbox";

const ParentPortal = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  
  const [portalLoading, setPortalLoading] = useState(false);
  const [tuitionUrl, setTuitionUrl] = useState<string | null>(null);

  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Portal de Padres | Preescolar Sonsoles";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow, noarchive, nosnippet";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
      document.title = prevTitle;
    };
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) checkStaff(s.user.id);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) checkStaff(data.session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkStaff = async (uid: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    const staff = (data ?? []).some((r) => r.role === "teacher" || r.role === "admin");
    setIsStaff(staff);
    if (staff) navigate("/admin/mensajes");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signUp({
      email: signupEmail.trim(),
      password: signupPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/portal-padres`,
        data: { display_name: signupName.trim() },
      },
    });
    setAuthLoading(false);
    if (error) {
      toast({ title: "Error al crear cuenta", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "¡Cuenta creada!", description: "Revisa tu correo para confirmar tu cuenta." });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });
    setAuthLoading(false);
    if (error) {
      toast({ title: "Error al iniciar sesión", description: error.message, variant: "destructive" });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setAuthLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Revisa tu correo",
      description: "Te enviamos un enlace para restablecer tu contraseña.",
    });
    setShowForgot(false);
    setForgotEmail("");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setTuitionUrl(null);
    setIsStaff(false);
  };

  const handleOpenPagos = async () => {
    setPortalLoading(true);
    try {
      let url = tuitionUrl;
      if (!url) {
        const { data, error } = await supabase.functions.invoke("parent-portal-auth", { body: {} });
        if (error || !data?.tuitionUrl) {
          toast({ title: "Error", description: "No se pudo abrir el pago.", variant: "destructive" });
          return;
        }
        url = data.tuitionUrl;
        setTuitionUrl(url);
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <div className="container py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-ink mb-8">
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>

        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/15 text-primary mb-4">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="text-4xl sm:text-5xl text-ink mb-3" style={{ fontFamily: "'ChildsPlayground', cursive" }}>
              Portal de Padres
            </h1>
            <p className="text-muted-foreground">Inicia sesión para mensajear a las maestras y acceder a recursos.</p>
          </div>

          {!session ? (
            <Card className="p-8 rounded-3xl border-2 shadow-soft">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login"><LogIn className="h-4 w-4 mr-2" />Iniciar sesión</TabsTrigger>
                  <TabsTrigger value="signup"><UserPlus className="h-4 w-4 mr-2" />Crear cuenta</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  {!showForgot ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-ink mb-2">Correo</label>
                        <Input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="h-12 rounded-xl" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-ink mb-2">Contraseña</label>
                        <Input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="h-12 rounded-xl" />
                      </div>
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => { setShowForgot(true); setForgotEmail(loginEmail); }}
                          className="text-sm text-primary hover:underline font-medium"
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>
                      <Button type="submit" variant="hero" size="xl" className="w-full" disabled={authLoading}>
                        {authLoading ? "Ingresando…" : "Iniciar sesión"}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
                      </p>
                      <div>
                        <label className="block text-sm font-semibold text-ink mb-2">Correo</label>
                        <Input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="h-12 rounded-xl" />
                      </div>
                      <Button type="submit" variant="hero" size="xl" className="w-full" disabled={authLoading}>
                        {authLoading ? "Enviando…" : "Enviar enlace"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setShowForgot(false)}
                        className="block w-full text-center text-sm text-muted-foreground hover:text-ink"
                      >
                        Volver al inicio de sesión
                      </button>
                    </form>
                  )}
                </TabsContent>
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-ink mb-2">Nombre completo</label>
                      <Input required value={signupName} onChange={(e) => setSignupName(e.target.value)} maxLength={100} className="h-12 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-ink mb-2">Correo</label>
                      <Input type="email" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-ink mb-2">Contraseña</label>
                      <Input type="password" required minLength={6} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                    <Button type="submit" variant="hero" size="xl" className="w-full" disabled={authLoading}>
                      {authLoading ? "Creando…" : "Crear cuenta"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Hola, <span className="font-semibold text-ink">{session.user.email}</span>
                </p>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" /> Salir
                </Button>
              </div>

              <Tabs defaultValue="messages" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="messages"><MessageCircle className="h-4 w-4 mr-2" />Mensajes</TabsTrigger>
                  <TabsTrigger value="tuition"><CreditCard className="h-4 w-4 mr-2" />Recursos</TabsTrigger>
                </TabsList>

                <TabsContent value="messages" className="mt-6">
                  <MessagesInbox userId={session.user.id} isStaff={isStaff} />
                </TabsContent>

                <TabsContent value="tuition" className="mt-6">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card
                      className="p-5 rounded-2xl border-2 hover:border-primary hover:shadow-soft transition-all cursor-pointer"
                      onClick={handleOpenPagos}
                    >
                      <Receipt className="h-6 w-6 text-leaf mb-3" />
                      <h3 className="font-bold text-ink mb-1">Pagos</h3>
                      <p className="text-sm text-muted-foreground">
                        {portalLoading ? "Abriendo…" : "Pagar matrícula"}
                      </p>
                    </Card>
                    <Card className="p-5 rounded-2xl border-2">
                      <Calendar className="h-6 w-6 text-primary mb-3" />
                      <h3 className="font-bold text-ink mb-1">Calendario</h3>
                      <p className="text-sm text-muted-foreground">Próximamente</p>
                    </Card>
                    <Card className="p-5 rounded-2xl border-2">
                      <FileText className="h-6 w-6 text-accent mb-3" />
                      <h3 className="font-bold text-ink mb-1">Formularios</h3>
                      <p className="text-sm text-muted-foreground">Próximamente</p>
                    </Card>
                    <Card className="p-5 rounded-2xl border-2">
                      <Megaphone className="h-6 w-6 text-azure mb-3" />
                      <h3 className="font-bold text-ink mb-1">Anuncios</h3>
                      <p className="text-sm text-muted-foreground">Próximamente</p>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentPortal;
