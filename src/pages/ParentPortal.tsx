import { useEffect, useState } from "react";

import { Link } from "react-router-dom";
import { Lock, ArrowLeft, CreditCard, Calendar, FileText, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ParentPortal = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [tuitionUrl, setTuitionUrl] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("parent-portal-auth", {
        body: { password: password.trim() },
      });
      if (error || !data?.tuitionUrl) {
        toast({
          title: "Acceso denegado",
          description: "La contraseña ingresada no es correcta.",
          variant: "destructive",
        });
        return;
      }
      setTuitionUrl(data.tuitionUrl);
      setPassword("");
    } catch {
      toast({ title: "Error", description: "Intenta de nuevo en unos segundos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      <div className="container py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-ink mb-8">
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/15 text-primary mb-4">
              <Lock className="h-8 w-8" />
            </div>
            <h1 className="text-4xl sm:text-5xl text-ink mb-3" style={{ fontFamily: "'ChildsPlayground', cursive" }}>
              Portal de Padres
            </h1>
            <p className="text-muted-foreground">
              Esta página es para familias actualmente matriculadas.
            </p>
          </div>

          {!tuitionUrl ? (
            <Card className="p-8 rounded-3xl border-2 shadow-soft">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="portal-password" className="block text-sm font-semibold text-ink mb-2">
                    Contraseña del portal
                  </label>
                  <Input
                    id="portal-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa la contraseña"
                    autoComplete="current-password"
                    maxLength={200}
                    required
                    className="h-12 rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Si no la tienes, contáctanos en el WhatsApp del preescolar.
                  </p>
                </div>
                <Button type="submit" variant="hero" size="xl" className="w-full" disabled={loading}>
                  {loading ? "Verificando…" : "Ingresar"}
                </Button>
              </form>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="p-8 rounded-3xl border-2 shadow-soft text-center">
                <h2 className="text-2xl text-ink mb-2" style={{ fontFamily: "'ChildsPlayground', cursive" }}>
                  ¡Bienvenidos, familia Sonsoles!
                </h2>
                <p className="text-muted-foreground mb-6">
                  Aquí puedes pagar la matrícula y acceder a recursos de la escuela.
                </p>
                <Button asChild variant="hero" size="xl" className="w-full sm:w-auto">
                  <a href={tuitionUrl} target="_blank" rel="noopener noreferrer">
                    <CreditCard className="h-5 w-5" /> Pagar matrícula
                  </a>
                </Button>
              </Card>

              <div className="grid sm:grid-cols-3 gap-4">
                <Card className="p-5 rounded-2xl border-2 hover:-translate-y-1 transition-transform">
                  <Calendar className="h-6 w-6 text-primary mb-3" />
                  <h3 className="font-bold text-ink mb-1">Calendario</h3>
                  <p className="text-sm text-muted-foreground">Próximamente</p>
                </Card>
                <Card className="p-5 rounded-2xl border-2 hover:-translate-y-1 transition-transform">
                  <FileText className="h-6 w-6 text-leaf mb-3" />
                  <h3 className="font-bold text-ink mb-1">Formularios</h3>
                  <p className="text-sm text-muted-foreground">Próximamente</p>
                </Card>
                <Card className="p-5 rounded-2xl border-2 hover:-translate-y-1 transition-transform">
                  <Megaphone className="h-6 w-6 text-azure mb-3" />
                  <h3 className="font-bold text-ink mb-1">Anuncios</h3>
                  <p className="text-sm text-muted-foreground">Próximamente</p>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentPortal;
