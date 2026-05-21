import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const photos: { name: string; w: number; h: number }[] = [
  { name: "Foto de Nilda_1.jpg", w: 2480, h: 1536 },
  { name: "Foto de Nilda_11.jpg", w: 1599, h: 899 },
  { name: "Foto de Nilda_12.jpg", w: 1599, h: 899 },
  { name: "Foto de Nilda_13.jpg", w: 1200, h: 1600 },
  { name: "Foto de Nilda_2.jpg", w: 2048, h: 1536 },
  { name: "Foto de Nilda_3.jpg", w: 1536, h: 2048 },
  { name: "Foto de Nilda_4.jpg", w: 1567, h: 951 },
  { name: "Foto de Nilda_5.jpg", w: 1600, h: 1200 },
  { name: "Foto de Nilda_6.jpg", w: 2000, h: 1126 },
  { name: "Foto de Nilda_7.jpg", w: 1024, h: 768 },
  { name: "Foto de Nilda_8.jpg", w: 1031, h: 1021 },
  { name: "Foto de Nilda_9.jpg", w: 1536, h: 2048 },
  { name: "a-group-of-kids-together.jpg", w: 1980, h: 3520 },
  { name: "gallery-childs-together.jpg", w: 1536, h: 2728 },
  { name: "kids-making-arts.jpg", w: 1920, h: 1080 },
];


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
          {photos.map((p, i) => {
            const dirs = ["up", "left", "down", "right"] as const;
            const dir = dirs[i % dirs.length];
            const src = `/gallery-images/${encodeURIComponent(p.name)}`;
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
                  decoding="async"
                  width={p.w}
                  height={p.h}
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
