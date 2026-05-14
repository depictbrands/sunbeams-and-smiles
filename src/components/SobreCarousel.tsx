import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, ChevronDown } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import founderPhoto from "@/assets/founder-griselle-new.webp";
import kidsDrawing from "@/assets/kids-drawing.gif";


const SobreCarousel = () => {
  const sobreAutoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true }));
  const teachersAutoplay = useRef(Autoplay({ delay: 2500, stopOnInteraction: false, stopOnMouseEnter: true }));
  const [bioOpen, setBioOpen] = useState(false);
  const [credsOpen, setCredsOpen] = useState(false);
  const [recogOpen, setRecogOpen] = useState(false);

  const moreBtn = (open: boolean, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-bold text-ink underline-offset-4 hover:underline mt-2 mb-4"
      aria-expanded={open}
    >
      {open ? "Leer menos" : "Leer más"}
      <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
  );

  const bioFull = "Formada en el Conservatorio de Música de Puerto Rico, maestra de los métodos Suzuki, Dalcroze, Orff Schulwerk, Kindermusik y directora coral en el Coro de Niños de San Juan por 30 años.";
  const bioPeek = "Formada en el Conservatorio de Música de Puerto Rico, maestra de los métodos Suzuki, Dalcroze, Orff Schulwerk, Kindermusik…";
  const credsFull = "Bachillerato en Artes y Maestría en Educación del Niño en la Universidad de Puerto Rico";
  const recogFull = "Autora del libro Canciones y cantos-juegos infantiles del folklore puertorriqueño y su disco compacto — nominado a los Grammy Latinos como Mejor Álbum de Música Latina para Niños, 7ma entrega, Nueva York, noviembre 2006.";
  const recogPeek = "Autora del libro Canciones y cantos-juegos infantiles del folklore puertorriqueño y su disco compacto…";

  return (
    <Carousel opts={{ loop: true, align: "start" }} plugins={[sobreAutoplay.current]} className="group">
      <CarouselContent className="-ml-4 h-[80vh] sm:h-auto">
        {/* Slide 1 — Pink: Founder */}
        <CarouselItem className="pl-4 basis-[85%] sm:basis-full">
          <div className="rounded-3xl shadow-soft overflow-hidden h-full overflow-y-auto sm:overflow-hidden" style={{ background: "#FF80B0" }}>
            <div className="p-6 sm:p-14 lg:p-16 flex flex-col lg:flex-row gap-6 lg:gap-12 items-center text-ink lg:min-h-[560px] h-full max-w-5xl mx-auto">
              <img
                src={founderPhoto}
                alt="Griselle Bou, Directora de Preescolar SonSoles"
                loading="lazy"
                width={1797}
                height={1920}
                className="w-44 sm:w-80 lg:w-96 h-auto object-contain flex-shrink-0 self-center block"
              />
              <div className="flex flex-col justify-center text-left max-w-2xl">
                <span className="block font-bold uppercase tracking-[0.18em] text-xs sm:text-sm text-ink mb-3 sm:mb-4">
                  FUNDADORA Y DIRECTORA
                </span>
                <h3 className="text-3xl sm:text-5xl md:text-6xl font-bold leading-[1.05] mb-3 tracking-tight" style={{ fontFamily: "'Sour Gummy', 'Sora', system-ui, sans-serif" }}>
                  Griselle Bou de Blanco
                </h3>
                <p className="text-sm sm:text-lg leading-relaxed mb-4 sm:mb-6 text-primary-foreground" style={{ color: "#fadfef" }}>
                  Educadora • Autora • Pianista
                </p>

                {/* Mobile: peek + "Más detalle" per block */}
                <div className="md:hidden">
                  <p className="text-sm leading-relaxed text-ink">
                    {bioOpen ? bioFull : bioPeek}
                  </p>
                  {moreBtn(bioOpen, () => setBioOpen((v) => !v))}

                  <div className="rounded-2xl bg-card/60 px-5 py-4 text-sm text-ink leading-snug">
                    {credsFull}
                  </div>

                  <div className="rounded-2xl bg-ink px-5 py-4 mt-4">
                    <span className="block font-bold uppercase tracking-[0.18em] text-[11px] mb-2" style={{ color: "#FF80B0" }}>
                      Reconocimiento Internacional
                    </span>
                    <p className="text-sm leading-relaxed" style={{ color: "#fadfef" }}>
                      {recogOpen ? (
                        <>Autora del libro <em>Canciones y cantos-juegos infantiles del folklore puertorriqueño</em> y su disco compacto — nominado a los Grammy Latinos como Mejor Álbum de Música Latina para Niños, 7ma entrega, Nueva York, noviembre 2006.</>
                      ) : (
                        recogPeek
                      )}
                    </p>
                  </div>
                  {moreBtn(recogOpen, () => setRecogOpen((v) => !v))}


                  <div className="mt-2 mb-4">
                    <Button asChild size="lg" className="bg-ink text-card hover:bg-ink/90 shadow-playful hover:-translate-y-0.5 transition-all">
                      <a href="mailto:grisellebou@gmail.com">
                        <Mail className="h-4 w-4" /> Escríbele a Griselle
                      </a>
                    </Button>
                  </div>
                </div>
                {/* Desktop / tablet: full content */}
                <div className="hidden md:block">
                  <p className="text-base sm:text-lg leading-relaxed text-ink mb-8">
                    Formada en el Conservatorio de Música de Puerto Rico, maestra de los métodos Suzuki, Dalcroze, Orff Schulwerk, Kindermusik y directora coral en el Coro de Niños de San Juan por 30 años.
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-5">
                    <div className="rounded-2xl bg-card/60 px-5 py-4 text-sm sm:text-base text-ink leading-snug">
                      Bachillerato en Artes y Maestría en Educación del Niño en la Universidad de Puerto Rico
                    </div>
                  </div>
                  <div className="rounded-2xl bg-ink px-6 py-5 mb-8">
                    <span className="block font-bold uppercase tracking-[0.18em] text-xs sm:text-sm mb-2" style={{ color: "#FF80B0" }}>
                      Reconocimiento Internacional
                    </span>
                    <p className="text-sm sm:text-base leading-relaxed" style={{ color: "#fadfef" }}>
                      Autora del libro <em>Canciones y cantos-juegos infantiles del folklore puertorriqueño</em> y su disco compacto — nominado a los Grammy Latinos como Mejor Álbum de Música Latina para Niños, 7ma entrega, Nueva York, noviembre 2006.
                    </p>
                  </div>
                  <div>
                    <Button asChild size="lg" className="bg-ink text-card hover:bg-ink/90 shadow-playful hover:-translate-y-0.5 transition-all">
                      <a href="mailto:grisellebou@gmail.com">
                        <Mail className="h-4 w-4" /> Escríbele a Griselle
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CarouselItem>

        {/* Slide 2 — Purple: Teachers */}
        <CarouselItem className="pl-4 basis-[85%] sm:basis-full">
          <div className="rounded-3xl shadow-soft overflow-hidden h-full overflow-y-auto sm:overflow-hidden" style={{ background: "#9B6BD1" }}>
            <div className="p-8 sm:p-14 lg:p-16 flex flex-col gap-10 items-center text-ink lg:min-h-[560px] sm:h-full max-w-5xl mx-auto">
              {(() => {
                const teachers = [
                  { src: "/teacher-profile-pictures/maestra-Adriana.jpeg", name: "Adriana" },
                  { src: "/teacher-profile-pictures/maestra-Bea.jpeg", name: "Bea" },
                  { src: "/teacher-profile-pictures/maestra-Esmeralda.jpeg", name: "Esmeralda" },
                  { src: "/teacher-profile-pictures/maestra-Keisy.jpeg", name: "Keisy" },
                  { src: "/teacher-profile-pictures/maestra-Nay.jpeg", name: "Nay" },
                  { src: "/teacher-profile-pictures/maestra-Yeidy.jpg", name: "Yeidy" },
                ];
                return (
                  <>
                    {/* Mobile: nested carousel, one circle at a time */}
                    <div className="sm:hidden w-full max-w-xs mx-auto flex-shrink-0 order-first">
                      <Carousel opts={{ loop: true, align: "center" }} plugins={[teachersAutoplay.current]}>
                        <CarouselContent>
                          {teachers.map((t, i) => (
                            <CarouselItem key={i} className="flex justify-center">
                              <div className="flex flex-col items-center gap-3">
                                <img
                                  src={t.src}
                                  alt={`Maestra ${t.name}`}
                                  loading="lazy"
                                  width={400}
                                  height={400}
                                  className="w-56 h-56 rounded-full object-cover border-4 shadow-md"
                                  style={{ borderColor: "#D4B5F0" }}
                                />
                                <span className="text-base font-bold text-white tracking-wide">{t.name}</span>
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                      </Carousel>
                    </div>
                    {/* Tablet/Desktop: grid 4 per row */}
                    <div className="hidden sm:grid grid-cols-4 gap-4 items-start w-full max-w-3xl mx-auto">
                      {teachers.map((t, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                          <img
                            src={t.src}
                            alt={`Maestra ${t.name}`}
                            loading="lazy"
                            width={400}
                            height={400}
                            className="w-full aspect-square rounded-full object-cover border-4 shadow-md"
                            style={{ borderColor: "#D4B5F0" }}
                          />
                          <span className="text-sm font-bold text-white tracking-wide text-center">{t.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </CarouselItem>

        {/* Slide 3 — Green: Staff */}
        <CarouselItem className="pl-4 basis-[85%] sm:basis-full">
          <div className="rounded-3xl shadow-soft overflow-hidden h-full overflow-y-auto sm:overflow-hidden" style={{ background: "#6BB36B" }}>
            <div className="p-8 sm:p-14 lg:p-16 flex flex-col justify-center text-ink lg:min-h-[560px] sm:h-full max-w-5xl mx-auto">
              <span className="block font-bold uppercase tracking-[0.18em] text-xs sm:text-sm mb-4 text-white text-center">
                NUESTRO STAFF
              </span>
              <h3 className="text-4xl sm:text-5xl font-bold leading-[1.05] mb-6 tracking-tight text-center md:text-7xl" style={{ fontFamily: "'Sour Gummy', 'Sora', system-ui, sans-serif" }}>
                Un equipo que cuida cada detalle
              </h3>
              <p className="text-base sm:text-lg leading-relaxed text-slate-50 max-w-2xl">
                {"\n"}
              </p>
            </div>
          </div>
        </CarouselItem>

        {/* Slide 4 — Light Blue: Parents */}
        <CarouselItem className="pl-4 basis-[85%] sm:basis-full">
          <div className="rounded-3xl shadow-soft overflow-hidden h-full overflow-y-auto sm:overflow-hidden" style={{ background: "#7CC9E8" }}>
            <div className="p-8 sm:p-14 lg:p-16 flex flex-col justify-center items-center text-ink lg:min-h-[560px] sm:h-full max-w-5xl mx-auto">
              <span className="block font-bold uppercase tracking-[0.18em] text-xs sm:text-sm mb-4 text-white text-center">
                NUESTRAS FAMILIAS
              </span>
              <h3 className="text-4xl sm:text-5xl font-bold leading-[1.05] mb-6 tracking-tight text-center md:text-7xl" style={{ fontFamily: "'Sour Gummy', 'Sora', system-ui, sans-serif" }}>
                Las familias son las principales protagonistas de nuestro programa educativo.
              </h3>
              <img
                src={kidsDrawing}
                alt="Dibujo infantil de una familia con la bandera de Puerto Rico"
                loading="lazy"
                width={1280}
                height={896}
                className="block w-full max-w-xl h-auto object-contain mb-6 rounded-3xl shadow-2xl border-4 border-azure bg-white"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mx-auto mt-2">
                {[
                  "Los padres reciben información periódica del desarrollo educativo del niño.",
                  "Se ofrecen cursos de orientación familiar con métodos prácticos para el desarrollo integral de sus hijos.",
                  "El Preescolar SonSoles apoya a los padres, quienes son los primeros educadores de los hijos.",
                ].map((text, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-white/90 px-5 py-4 text-sm sm:text-base text-ink leading-snug shadow-md border-2 border-white text-center"
                  >
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CarouselItem>

      </CarouselContent>
      <CarouselPrevious className="left-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      <CarouselNext className="right-3 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Carousel>
  );
};

export default SobreCarousel;
