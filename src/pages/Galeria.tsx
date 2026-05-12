import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const photoUrls = [
  "90ddcee5-e4b1-4fcd-be96-c2d10d77698f.jpg",
  "Foto de Nilda🌷💗.jpg",
  "Foto de Nilda🌷💗 2.jpg",
  "Foto de Nilda🌷💗 3.jpg",
  "Foto de Nilda🌷💗 4.jpg",
  "Foto de Nilda🌷💗 6.jpg",
  "Foto de Nilda🌷💗 7.jpg",
  "Foto de Nilda🌷💗 8.jpg",
  "Foto de Nilda🌷💗 9.jpg",
  "Foto de Nilda🌷💗 11.jpg",
  "Foto de Nilda🌷💗 12.jpg",
  "Foto de Nilda🌷💗 13.jpg",
  "IMG_7440.jpg",
  "PHOTO-2025-10-14-10-32-08.jpg",
].map((name) => `/gallery-optimized/${encodeURIComponent(name)}`);

const Galeria = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-ink hover:text-primary font-semibold">
            <ArrowLeft className="h-5 w-5" /> Volver
          </Link>
          <span className="font-display text-lg text-ink" style={{ fontFamily: "'SoupBone', serif" }}>
            Preescolar SonSoles
          </span>
          <div className="w-16" />
        </div>
      </header>

      <section className="container py-12 sm:py-16">
        <div className="mb-10 sm:mb-14 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <span className="inline-block bg-muted text-ink text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4">
              Nuestras Historias
            </span>
            <h1
              className="text-5xl sm:text-7xl text-ink leading-none"
              style={{ fontFamily: "'ChildsPlayground', cursive" }}
            >
              Galería
            </h1>
          </div>
          <p className="text-muted-foreground max-w-sm sm:text-right">
            Momentos capturados del día a día en nuestro preescolar: el ambiente, los espacios y la alegría de nuestros niños.
          </p>
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-3 gap-2 sm:gap-3 [column-fill:_balance]">
          {photoUrls.map((src, i) => {
            const dirs = ["up", "left", "down", "right"] as const;
            const dir = dirs[i % dirs.length];
            return (
              <div
                key={src}
                className={`mb-2 sm:mb-3 break-inside-avoid overflow-hidden rounded-2xl shadow-playful bg-card group gallery-anim gallery-anim-${dir}`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <img
                  src={src}
                  alt={`Foto del preescolar ${i + 1}`}
                  loading="lazy"
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Galeria;
