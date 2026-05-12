import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Restablecer contraseña | Preescolar Sonsoles";
    // Supabase parses the recovery token from the URL hash automatically.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Contraseña muy corta", description: "Mínimo 6 caracteres.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Contraseña actualizada", description: "Ya puedes iniciar sesión." });
    await supabase.auth.signOut();
    navigate("/portal-padres");
  };

  return (
    <div className="min-h-screen bg-muted">
      <div className="container py-10">
        <Link to="/portal-padres" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-ink mb-8">
          <ArrowLeft className="h-4 w-4" /> Volver al portal
        </Link>

        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/15 text-primary mb-4">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl text-ink mb-3" style={{ fontFamily: "'ChildsPlayground', cursive" }}>
              Restablecer contraseña
            </h1>
            <p className="text-muted-foreground">Crea una nueva contraseña para tu cuenta.</p>
          </div>

          <Card className="p-8 rounded-3xl border-2 shadow-soft">
            {!ready ? (
              <p className="text-center text-muted-foreground text-sm">
                Verificando enlace de recuperación… Si llegaste aquí sin un enlace válido, solicita uno nuevo desde el portal.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-2">Nueva contraseña</label>
                  <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-2">Confirmar contraseña</label>
                  <Input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <Button type="submit" variant="hero" size="xl" className="w-full" disabled={loading}>
                  {loading ? "Guardando…" : "Guardar contraseña"}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
