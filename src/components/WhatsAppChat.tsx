import { useState } from "react";
import { X, MessageCircle } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

const PHONE = "17879935623"; // WhatsApp Business number for Preescolar Sonsoles

const QUICK_QUESTIONS = [
  "Hola, me gustaría información sobre la matrícula y disponibilidad. 🌟",
  "¿Cuáles son los horarios y la mensualidad del preescolar?",
  "¿Puedo agendar un tour para conocer las facilidades?",
  "¿Qué edades aceptan y cómo es el currículo diario?",
  "¿Ofrecen transporte y servicio de alimentos?",
];

const buildLink = (text: string) =>
  `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;

const WhatsAppChat = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Chat de WhatsApp con Preescolar Sonsoles"
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-3xl bg-card shadow-playful border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="bg-[#25D366] text-white p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <WhatsAppIcon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm">Preescolar Sonsoles</div>
              <div className="text-xs opacity-90">Normalmente responde en minutos</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar chat"
              className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 bg-muted/40 max-h-[60vh] overflow-y-auto">
            <div className="bg-card rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm mb-4 text-sm text-ink">
              ¡Hola! 👋 Soy del equipo de <strong>Preescolar Sonsoles</strong>.
              ¿En qué te puedo ayudar hoy? Elige una pregunta o escríbenos directamente.
            </div>

            <div className="space-y-2">
              {QUICK_QUESTIONS.map((q) => (
                <a
                  key={q}
                  href={buildLink(q)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-left text-sm bg-card hover:bg-primary hover:text-primary-foreground border border-border rounded-2xl px-4 py-3 transition-colors text-ink"
                >
                  {q}
                </a>
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <a
            href={buildLink("Hola, me gustaría más información sobre Preescolar Sonsoles.")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1faa55] text-white font-bold py-3.5 transition-colors"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Abrir WhatsApp
          </a>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar chat de WhatsApp" : "Abrir chat de WhatsApp"}
        aria-expanded={open}
        className="fixed bottom-5 right-4 sm:right-6 z-50 h-14 w-14 rounded-full bg-[#25D366] hover:bg-[#1faa55] text-white shadow-playful flex items-center justify-center transition-all hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <WhatsAppIcon className="h-7 w-7" />}
        {!open && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent border-2 border-card animate-pulse" />
        )}
      </button>
    </>
  );
};

export default WhatsAppChat;
