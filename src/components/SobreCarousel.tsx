import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, ChevronDown } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import founderPhoto from "@/assets/founder-griselle-new.webp";
import kidsDrawing from "@/assets/kids-drawing.gif";
import teacher1 from "@/assets/teacher-1.webp";
import teacher2 from "@/assets/teacher-2.webp";
import teacher3 from "@/assets/teacher-3.webp";
import teacher4 from "@/assets/teacher-4.webp";
import teacher5 from "@/assets/teacher-5.webp";
import teacher6 from "@/assets/teacher-6.webp";
import teacher7 from "@/assets/teacher-7-updated.webp";

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
                    {bioOpen ? bioFull : peek(bioFull)}
                  </p>
                  {moreBtn(bioOpen, () => setBioOpen((v) => !v))}

                  <div className="rounded-2xl bg-card/60 px-5 py-4 text-sm text-ink leading-snug">
                    {credsOpen ? credsFull : peek(credsFull, 60)}
                  </div>
                  {moreBtn(credsOpen, () => setCredsOpen((v) => !v))}

                  <div className="rounded-2xl bg-ink px-5 py-4">
                    <span className="block font-bold uppercase tracking-[0.18em] text-[11px] mb-2" style={{ color: "#FF80B0" }}>
                      Reconocimiento Internacional
                    </span>
                    <p className="text-sm leading-relaxed" style={{ color: "#fadfef" }}>
                      {recogOpen ? (
                        <>Autora del libro <em>Canciones y cantos-juegos infantiles del folklore puertorriqueño</em> y su disco compacto — nominado a los Grammy Latinos como Mejor Álbum de Música Latina para Niños, 7ma entrega, Nueva York, noviembre 2006.</>
                      ) : (
                        peek(recogFull, 90)
                      )}
                    </p>
                  </div>
                  {moreBtn(recogOpen, () => setRecogOpen((v) => !v))}


                  <div className="mt-2">
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
            <div className="p-8 sm:p-14 lg:p-16 flex flex-col lg:flex-row gap-10 lg:gap-12 items-center text-ink lg:min-h-[560px] sm:h-full max-w-5xl mx-auto">
              {/* Mobile: nested carousel, one circle at a time */}
              <div className="sm:hidden w-full max-w-xs mx-auto flex-shrink-0">
                <Carousel opts={{ loop: true, align: "center" }} plugins={[teachersAutoplay.current]}>
                  <CarouselContent>
                    {[teacher1, teacher2, teacher3, teacher4, teacher5, teacher6, teacher7].map((src, i) => (
                      <CarouselItem key={i} className="flex justify-center">
                        <img
                          src={src}
                          alt={`Maestra ${i + 1}`}
                          loading="lazy"
                          width={400}
                          height={400}
                          className="w-56 h-56 rounded-full object-cover border-4 shadow-md"
                          style={{ borderColor: "#D4B5F0" }}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
              {/* Tablet/Desktop: grid */}
              <div className="hidden sm:grid grid-cols-3 gap-3 sm:gap-4 flex-shrink-0 self-center w-full max-w-md sm:w-80 lg:w-96 mx-auto">
                {[teacher1, teacher2, teacher3, teacher4, teacher5, teacher6, teacher7].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Maestra ${i + 1}`}
                    loading="lazy"
                    width={400}
                    height={400}
                    className="w-full aspect-square rounded-full object-cover border-4 shadow-md"
                    style={{ borderColor: "#D4B5F0" }}
                  />
                ))}
              </div>
              <div className="flex flex-col justify-center text-left max-w-2xl">
                <span className="block font-bold uppercase tracking-[0.18em] text-xs sm:text-sm mb-4 text-white">
                  NUESTRAS MAESTRAS
                </span>
                <h3 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] mb-6 tracking-tight" style={{ fontFamily: "'Sour Gummy', 'Sora', system-ui, sans-serif" }}>
                  Maestras que enseñan con el corazón
                </h3>
                <p className="text-base sm:text-lg leading-relaxed text-slate-100">
                  En SonSoles cada maestra es elegida con cuidado: por su preparación, por su vocación y por su capacidad de amar a cada niño como único. Son especializadas en estimulación temprana, expertas en cada etapa del desarrollo, y cariñosas en cada gesto del día.
                </p>
              </div>
            </div>
          </div>
        </CarouselItem>

        {/* Slide 3 — Green: Family illustration */}
        <CarouselItem className="pl-4 basis-[85%] sm:basis-full">
          <div className="lg:hidden rounded-3xl overflow-hidden h-full">
            <div className="flex flex-col h-full justify-between min-h-[440px] lg:min-h-[560px]">
              <div className="px-6 pt-8 text-center">
                <h3 className="text-2xl sm:text-3xl font-bold text-ink leading-tight" style={{ fontFamily: "'ChildsPlayground', cursive" }}>
                  Las familias son las principales protagonistas de nuestro proyecto educativo.
                </h3>
              </div>
              <img
                src={kidsDrawing}
                alt="Dibujo infantil de una familia con la bandera de Puerto Rico"
                loading="lazy"
                width={1280}
                height={896}
                className="block w-full h-auto flex-1 object-contain my-4"
              />
              <div className="px-8 pb-8 flex justify-center">
                <Button asChild variant="sun" size="xl" className="px-6 text-base"><a href="https://calendly.com/preescolarsonsoles" target="_blank" rel="noopener noreferrer">Conoce nuestro programa</a></Button>
              </div>
            </div>
          </div>
          <div className="hidden lg:block relative rounded-3xl shadow-soft overflow-hidden h-full">
            <img
              src={kidsDrawing}
              alt="Dibujo infantil de una familia con la bandera de Puerto Rico"
              loading="lazy"
              width={1280}
              height={896}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 px-4 w-full max-w-3xl text-center">
              <h3 className="text-3xl lg:text-4xl font-bold text-ink leading-tight" style={{ fontFamily: "'ChildsPlayground', cursive" }}>
                Las familias son las principales protagonistas de nuestro proyecto educativo.
              </h3>
            </div>
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
              <Button asChild variant="sun" size="xl"><a href="https://calendly.com/preescolarsonsoles" target="_blank" rel="noopener noreferrer">Conoce nuestro programa</a></Button>
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
