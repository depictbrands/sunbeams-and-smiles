import { useState } from "react";
import { z } from "zod";
import { Mail, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const emailSchema = z
  .string()
  .trim()
  .email({ message: "Correo electrónico inválido" })
  .max(255, { message: "El correo es demasiado largo" });

const NewsletterForm = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast({
        title: "Correo inválido",
        description: parsed.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: parsed.data.toLowerCase() });
    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "¡Ya estás suscrito!",
          description: "Este correo ya forma parte de nuestra lista.",
        });
        setDone(true);
        return;
      }
      toast({
        title: "Algo salió mal",
        description: "Inténtalo de nuevo en un momento.",
        variant: "destructive",
      });
      return;
    }

    setDone(true);
    setEmail("");
    toast({
      title: "¡Gracias por suscribirte!",
      description: "Te mantendremos al tanto de nuestras novedades.",
    });
  };

  return (
    <div>
      <h4 className="font-bold mb-1 text-base">¡Mantente en contacto!</h4>
      <p className="text-sm opacity-70 mb-3">
        Suscríbete y recibe novedades de Sonsoles.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Correo electrónico
        </label>
        <div className="relative flex-1">
          <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
          <input
            id="newsletter-email"
            type="email"
            required
            maxLength={255}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (done) setDone(false);
            }}
            placeholder="tu@correo.com"
            className="w-full pl-9 pr-3 py-2 rounded-full bg-card/10 border border-white/15 text-sm text-ink-foreground placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/60"
          />
        </div>
        <Button
          type="submit"
          variant="hero"
          size="default"
          disabled={loading}
          className="rounded-full"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : done ? (
            <Check className="h-4 w-4" />
          ) : (
            "Suscribirme"
          )}
        </Button>
      </form>
    </div>
  );
};

export default NewsletterForm;
