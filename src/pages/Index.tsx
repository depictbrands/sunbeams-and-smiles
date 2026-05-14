import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Instagram, Facebook, Phone, Mail, Star, Heart, Sparkles, Apple, Shield, BookOpen, Music, Palette, Users, Lock, Menu, MapPin, PersonStanding, Brain, Activity, MessageCircle, Clock, Navigation, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import metodologiaMusic from "@/assets/metodologia-music.jpg";
import metodologiaArt from "@/assets/metodologia-art.jpg";
import metodologiaRead from "@/assets/metodologia-read.jpg";
import { lazy, Suspense } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import logo from "@/assets/logo.gif";
const NewsletterForm = lazy(() => import("@/components/NewsletterForm"));
const VideoTestimonials = lazy(() => import("@/components/VideoTestimonials"));
const Performances = lazy(() => import("@/components/Performances"));
const WhatsAppChat = lazy(() => import("@/components/WhatsAppChat"));
const SobreCarousel = lazy(() => import("@/components/SobreCarousel"));
const GOOGLE_MAPS_EMBED_URL = "https://www.google.com/maps?q=C.+Madre+Teresa+Jornet,+San+Juan,+00926,+Puerto+Rico&output=embed";
const MAP_FACADE_IMAGE = "/map-facade.svg";
const heroKids = "/lovable-uploads/hero-kids-new.webp";


import playground from "@/assets/playground.webp";
import contactKids from "@/assets/contact-kids.webp";
import facility1 from "@/assets/facility-1.webp";
import facility2 from "@/assets/facility-2.webp";
import facility3 from "@/assets/facility-classroom.webp";
import facility4 from "/lovable-uploads/facility-play-new.jpg";
import facility5 from "/lovable-uploads/facility-extra-1.jpeg";
import facility6 from "/lovable-uploads/facility-extra-2.jpeg";
import facility7 from "/lovable-uploads/facility-extra-3.jpeg";
import sonsolesBuilding from "@/assets/sonsoles-building.webp";

import { useEffect, useState } from "react";

const Index = () => {
  const facilityImages = [facility1, facility2, facility3, facility4, facility5, facility6, facility7];
  const [facilityIndex, setFacilityIndex] = useState(0);
  const [deferredWidgetsReady, setDeferredWidgetsReady] = useState(false);
  const [mapActive, setMapActive] = useState(false);
  const [expandedCards, setExpandedCards] = useState<number[]>([]);
  useEffect(() => {
    const id = setInterval(() => {
      setFacilityIndex((i) => (i + 1) % facilityImages.length);
    }, 4000);
    return () => clearInterval(id);
  }, [facilityImages.length]);

  useEffect(() => {
    if (deferredWidgetsReady) return;

    let timeoutId = window.setTimeout(() => setDeferredWidgetsReady(true), 5000);

    const onScroll = () => {
      if (window.scrollY >= 200) {
        window.clearTimeout(timeoutId);
        setDeferredWidgetsReady(true);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("scroll", onScroll);
    };
  }, [deferredWidgetsReady]);

  useEffect(() => {
    if (!deferredWidgetsReady) return;

    const scriptId = "elfsight-platform-script";
    const FORM_STYLES = `
      input, textarea, select {
        color: #1f2937 !important;
        -webkit-text-fill-color: #1f2937 !important;
        caret-color: #1f2937 !important;
      }
      input::placeholder, textarea::placeholder {
        color: #6b7280 !important;
        -webkit-text-fill-color: #6b7280 !important;
        opacity: 1 !important;
      }
    `;
    const styledRoots = new WeakSet<ShadowRoot>();
    const injectStyles = (root: ShadowRoot) => {
      if (styledRoots.has(root)) return;
      styledRoots.add(root);
      const style = document.createElement("style");
      style.setAttribute("data-elfsight-fix", "true");
      style.textContent = FORM_STYLES;
      root.appendChild(style);
    };
    const scanForShadowRoots = (node: ParentNode) => {
      const elements = node.querySelectorAll('[class*="elfsight-app-"]');
      elements.forEach((el) => {
        const sr = (el as Element & { shadowRoot?: ShadowRoot }).shadowRoot;
        if (sr) {
          injectStyles(sr);
          scanForShadowRoots(sr);
        }
      });
    };

    let observer: MutationObserver | null = null;
    let cancelled = false;

    const start = () => {
      if (cancelled) return;
      // Inject Elfsight only after the user scrolls or the page has had time to become interactive.
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://elfsightcdn.com/platform.js";
        script.async = true;
        document.body.appendChild(script);
      }
      // Replace the polling interval with a MutationObserver to keep the
      // main thread idle until Elfsight actually mounts new shadow roots.
      scanForShadowRoots(document);
      observer = new MutationObserver(() => scanForShadowRoots(document));
      observer.observe(document.body, { childList: true, subtree: true });
    };

    start();

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [deferredWidgetsReady]);

  return (
    <div className="min-h-screen bg-background">
      {/* Announcement bar */}
      <div className="bg-accent text-accent-foreground text-center text-[11px] sm:text-sm font-bold py-2 px-3">
        <a
          href="https://wa.me/17879935623"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Comunícate por WhatsApp al 787-993-5623"
          className="inline-flex flex-nowrap items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap hover:opacity-80 transition-opacity"
        >
          <span>MATRÍCULA ABIERTA — Comunícate por</span>
          <WhatsAppIcon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
          <span className="underline">787-993-5623</span>
        </a>
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between py-3">
          <a href="#top" className="flex items-center gap-3">
            <img src={logo} alt="Preescolar SonSoles escudo" width={48} height={48} className="h-12 w-12" />
            <span className="font-display text-xl text-ink hidden sm:block" style={{ fontFamily: "'SoupBone', serif", fontWeight: 600 }}>Preescolar SonSoles</span>
          </a>
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-ink">
            <a href="#sobre" className="hover:text-primary transition-colors">Sobre Nosotros</a>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none">
                Proyecto Educativo <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="rounded-2xl">
                <DropdownMenuItem asChild>
                  <a href="#desarrollo-integral" className="cursor-pointer font-semibold">Formación Integral</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="#metodologia" className="cursor-pointer font-semibold">Proyecto Educativo</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <a href="#facilidades" className="hover:text-primary transition-colors">Facilidades</a>
            <a href="#testimonios" className="hover:text-primary transition-colors">Testimonios</a>
            <a href="/galeria" className="hover:text-primary transition-colors">Galería</a>
          </nav>
          <div className="flex items-center gap-3">
            <a href="https://www.instagram.com/preescolarsonsoles" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-ink hover:text-primary hidden sm:inline-flex"><Instagram className="h-5 w-5" /></a>
            <a href="https://www.facebook.com/preschoolsonsoles" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-ink hover:text-secondary hidden sm:inline-flex"><Facebook className="h-5 w-5" /></a>
            <Button asChild variant="outlineWarm" size="lg" className="hidden lg:inline-flex">
              <a href="/portal-padres"><Lock className="h-4 w-4" /> Portal de Padres</a>
            </Button>
            <Button asChild variant="hero" size="lg" className="hidden sm:inline-flex rounded-full max-lg:bg-accent max-lg:text-accent-foreground max-lg:hover:bg-accent/90 max-lg:h-9 max-lg:px-4 max-lg:text-sm">
              <a href="#contacto">Visítanos</a>
            </Button>

            {/* Mobile: quick CTA */}
            <Button asChild variant="hero" size="sm" className="lg:hidden rounded-full px-4">
              <a href="https://calendly.com/preescolarsonsoles" target="_blank" rel="noopener noreferrer">Agenda cita</a>
            </Button>

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" aria-label="Abrir menú">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85%] max-w-sm">
                <SheetTitle className="text-left text-lg font-bold text-ink mb-6" style={{ fontFamily: "'SoupBone', serif" }}>
                  Menú
                </SheetTitle>
                <nav className="flex flex-col gap-1 text-base font-semibold text-ink">
                  {[
                    { href: '#sobre', label: 'Sobre Nosotros' },
                    { href: '#metodologia', label: 'Metodología' },
                    { href: '#facilidades', label: 'Facilidades' },
                    { href: '#testimonios', label: 'Testimonios' },
                    { href: '/galeria', label: 'Galería' },
                  ].map((item) => (
                    <SheetClose asChild key={item.href}>
                      <a href={item.href} className="py-3 px-2 rounded-lg hover:bg-muted transition-colors">{item.label}</a>
                    </SheetClose>
                  ))}
                </nav>
                <div className="mt-6 flex flex-col gap-3">
                  <SheetClose asChild>
                    <Button asChild variant="outlineWarm" size="lg" className="w-full">
                      <a href="/portal-padres"><Lock className="h-4 w-4" /> Portal de Padres</a>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button asChild variant="hero" size="lg" className="w-full rounded-full">
                      <a href="#contacto">Visítanos</a>
                    </Button>
                  </SheetClose>
                </div>
                <div className="mt-8 flex items-center gap-5 justify-center">
                  <a href="https://www.instagram.com/preescolarsonsoles" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-ink hover:text-primary"><Instagram className="h-6 w-6" /></a>
                  <a href="https://www.facebook.com/preschoolsonsoles" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-ink hover:text-secondary"><Facebook className="h-6 w-6" /></a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section
        id="top"
        className="relative overflow-hidden isolate pb-16 sm:pb-24 bg-ink lg:bg-transparent bg-yellow-400"
      >
        {/* Desktop: video as background, deferred to avoid competing with LCP */}
        <video
          key="desktop"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster="/hero-poster-mobile.webp"
          aria-hidden="true"
          className="hidden lg:block absolute inset-0 w-full h-full object-cover -z-10"
        >
          <source src="/2ndVersion-hero.mp4" type="video/mp4" />
        </video>
        <div className="hidden lg:block absolute inset-0 bg-black/30 -z-10" />
        {/* Mobile hero: centered content inside a rounded card */}
        <div className="lg:hidden px-4 pt-6 pb-10 bg-yellow-400">
          <div className="bg-card text-ink rounded-[2rem] shadow-playful overflow-hidden p-6 flex flex-col items-center text-center gap-5 bg-amber-100">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-1.5 bg-ink/90 text-white px-3 py-1 rounded-full text-xs font-bold">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Maternal · Preescolar · PreKínder
              </div>
              <div className="inline-flex items-center gap-1.5 bg-ink/90 text-white px-3 py-1 rounded-full text-xs font-bold">
                <MapPin className="h-3.5 w-3.5 text-primary" /> Cupey, cerca de Los Paseos
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl leading-[1.05] text-ink" style={{ fontFamily: "'ChildsPlayground', cursive" }}>
              Sembrando excelencia en el corazón de la familia puertorriqueña.
            </h1>
            <div className="relative w-full max-w-[320px] mx-auto pb-6">
              <img
                src={heroKids}
                alt="Niños felices en Preescolar SonSoles"
                width={800}
                height={800}
                loading="eager"
                fetchPriority="high"
                decoding="sync"
                className="relative rounded-full shadow-playful w-full aspect-square object-cover border-8 border-primary"
              />
              <a
                href="#testimonios"
                aria-label="Ver testimonios — 5.0 en Google"
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-card rounded-2xl shadow-soft px-4 py-2.5 flex items-center gap-2 hover:shadow-playful transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary whitespace-nowrap"
              >
                <div className="flex -space-x-0.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-accent text-accent" />)}
                </div>
                <div className="text-xs text-left">
                  <div className="font-bold text-ink leading-tight">5.0 en Google</div>
                  <div className="text-muted-foreground leading-tight">Familias felices</div>
                </div>
              </a>
            </div>
            <Button asChild variant="hero" size="xl" className="rounded-full w-full max-w-xs">
              <a href="#contacto">Agenda un tour</a>
            </Button>
            <Button asChild variant="outlineWarm" size="xl" className="rounded-full w-full max-w-xs">
              <a href="#sobre">Conoce preescolar sonsoles</a>
            </Button>
          </div>
        </div>

        {/* Desktop hero (unchanged) */}
        <div className="hidden lg:grid container lg:grid-cols-2 gap-12 items-center py-12 lg:py-24 bg-ink lg:bg-transparent">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <div className="inline-flex items-center gap-2 bg-[#413D45] text-white px-4 py-1.5 rounded-full text-sm font-bold">
                <Sparkles className="h-4 w-4 text-primary" /> Maternal · Preescolar · PreKínder
              </div>
              <div className="inline-flex items-center gap-2 bg-[#413D45] text-white px-4 py-1.5 rounded-full text-sm font-bold">
                <MapPin className="h-4 w-4 text-primary" /> Cupey, cerca de Los Paseos
              </div>
            </div>
            <h1 className="text-5xl sm:text-6xl leading-[1.05] text-white mb-6 lg:text-6xl" style={{ fontFamily: "'ChildsPlayground', cursive" }}>
              Sembrando excelencia en el corazón de la familia puertorriqueña.
            </h1>
            <div className="flex flex-wrap gap-4">
              <Button asChild variant="hero" size="xl"><a href="#contacto">Agenda un tour</a></Button>
              <Button asChild variant="outlineWarm" size="xl"><a href="#sobre">Conoce preescolar sonsoles</a></Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-8 -left-8 w-24 h-24 bg-accent rounded-full animate-float-slow opacity-80" />
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-leaf/30 rounded-full animate-float-slow" style={{ animationDelay: '1.5s' }} />
            <img
              src={heroKids}
              alt="Niños felices en Preescolar SonSoles"
              width={800}
              height={800}
              loading="eager"
              fetchPriority="high"
              decoding="sync"
              className="relative rounded-full shadow-playful w-full max-w-[420px] mx-auto aspect-square object-cover border-8 border-primary"
            />
            <a
              href="#testimonios"
              aria-label="Ver testimonios — 5.0 en Google"
              className="absolute bottom-4 left-0 sm:left-4 bg-card rounded-2xl shadow-soft px-5 py-4 flex items-center gap-3 animate-wiggle hover:shadow-playful hover:-translate-y-0.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="flex -space-x-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-accent text-accent" />)}
              </div>
              <div className="text-sm">
                <div className="font-bold text-ink">5.0 en Google</div>
                <div className="text-muted-foreground text-xs">Familias felices</div>
              </div>
            </a>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 sm:h-16 overflow-hidden pointer-events-none" aria-hidden="true">
          <svg className="h-full w-full block" viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="hsl(var(--primary))">
              <animate
                attributeName="d"
                dur="6s"
                repeatCount="indefinite"
                values="M0,40 C240,90 480,0 720,40 C960,80 1200,10 1440,40 L1440,80 L0,80 Z;M0,40 C240,0 480,80 720,40 C960,0 1200,80 1440,40 L1440,80 L0,80 Z;M0,40 C240,90 480,0 720,40 C960,80 1200,10 1440,40 L1440,80 L0,80 Z"
              />
            </path>
          </svg>
        </div>
      </section>

      {/* INTRO */}
      <section id="sobre" className="bg-muted py-20">
        <div className="container text-center max-w-5xl mb-14">
          <span className="font-bold uppercase tracking-wider text-sm bg-secondary text-primary-foreground px-3 py-2 rounded-sm">¿Quiénes somos?</span>
          <h2 className="text-4xl sm:text-5xl text-ink mt-6 mb-5" style={{ fontFamily: "'ChildsPlayground', cursive" }}>SonSoles es un centro preescolar especializado en estimulación temprana, con una <span className="text-secondary">filosofía humanista</span> y <span className="text-secondary">espíritu cristiano</span>, donde cada niño es tratado como lo que es: <span className="text-secondary">único e irrepetible</span>.</h2>
        </div>

        <div className="container grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { color: 'bg-accent text-accent-foreground', title: 'Educación personalizada', text: 'Cada niño recibe una atención personalizada que fortalece sus facultades, virtudes y desarrollo integral.', icon: BookOpen },
            { color: 'bg-secondary text-secondary-foreground', title: 'Un ambiente familiar', text: 'Fomentamos la alegría, el respeto y los buenos modales en un ambiente de cariño y convivencia.', icon: Heart },
            { color: 'bg-leaf text-leaf-foreground', title: 'Papá y mamá', text: 'Creemos en una estrecha colaboración entre la familia y la escuela para acompañar el desarrollo integral de cada niño.', icon: PersonStanding },
            { color: 'bg-[#F4842C] text-white', title: 'Estimulación temprana', text: 'Utilizamos técnicas de estimulación temprana de vanguardia que fortalecen el aprendizaje, la creatividad y el desarrollo integral de cada niño.', icon: Sparkles },
          ].map((item, i) => {
            const isExpanded = expandedCards.includes(i);
            return (
              <div
                key={i}
                onClick={() =>
                  setExpandedCards((prev) =>
                    prev.includes(i) ? prev.filter((id) => id !== i) : [...prev, i]
                  )
                }
                className={`${item.color} group rounded-3xl p-8 shadow-soft hover:-translate-y-1 transition-all min-h-[220px] flex flex-col justify-center cursor-pointer`}
              >
                <item.icon className="h-10 w-10 mb-4 opacity-90" />
                <h3 className="text-xl md:text-2xl font-bold" style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>{item.title}</h3>
                <p
                  className={`text-base md:text-lg leading-snug overflow-hidden transition-all duration-500 ${
                    isExpanded
                      ? 'max-h-40 opacity-100 mt-2'
                      : 'max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100 group-hover:mt-2'
                  }`}
                  style={{ fontFamily: "'Sora', system-ui, sans-serif" }}
                >
                  {item.text}
                </p>
              </div>
            );
          })}
        </div>

        <div className="container relative pb-16">
          <Suspense fallback={<div className="min-h-[560px] rounded-3xl bg-muted/30" aria-hidden="true" />}>
            <SobreCarousel />
          </Suspense>
        </div>
      </section>

      {/* DESARROLLO INTEGRAL */}
      <section id="desarrollo-integral" className="bg-background py-24">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center mb-14">
            <span className="font-bold uppercase tracking-wider text-sm bg-secondary text-primary-foreground px-3 py-2 rounded-sm">Formación Integral</span>
            <h2 className="text-4xl sm:text-5xl text-ink mt-6 mb-6" style={{ fontFamily: "'ChildsPlayground', cursive" }}>
              La atención personal que se ofrece a cada niño es fundamental para el desarrollo de sus facultades y virtudes.
            </h2>
            <p className="text-lg sm:text-xl text-ink font-bold">Áreas de desarrollo</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Brain, title: 'Cognitiva', desc: 'Estimulamos  la inteligencia, la curiosidad y el sentido crítico.', color: 'text-pink', bg: 'bg-pink/10', hoverBorder: 'hover:border-pink/50' },
              { icon: Activity, title: 'Física', desc: 'Desarrollamos el motor grueso y fino, los patrones de movimiento, la lateralidad y el dominio espacial.', color: 'text-leaf', bg: 'bg-leaf/10', hoverBorder: 'hover:border-leaf/50' },
              { icon: Heart, title: 'Socioemocional', desc: 'Enseñamos a relacionarse, esperar, compartir y manejar emociones.', color: 'text-purple', bg: 'bg-purple/10', hoverBorder: 'hover:border-purple/50' },
              { icon: MessageCircle, title: 'Lingüística', desc: 'Creamos un ambiente bilingüe donde se aprende con naturalidad.', color: 'text-azure', bg: 'bg-azure/10', hoverBorder: 'hover:border-azure/50' },
              { icon: Palette, title: 'Creativa', desc: 'Despertamos la imaginación, la expresión, la sensibilidad estética a través del arte, la música y el baile.', color: 'text-accent', bg: 'bg-accent/20', hoverBorder: 'hover:border-accent/60' },
              { icon: Sparkles, title: 'Formativa', desc: 'Cultivamos las virtudes humanas: orden, obediencia, paciencia, respeto y alegría.', color: 'text-primary', bg: 'bg-primary/10', hoverBorder: 'hover:border-primary/50' },
            ].map((a: any, i) => {
              const cardInner = (
                <Card className={`group p-6 rounded-3xl border-2 border-border ${a.hoverBorder} hover:-translate-y-1 transition-all ${a.popupImages ? 'cursor-pointer w-full text-left' : ''}`}>
                  <div className={`${a.bg} ${a.color} w-full rounded-2xl flex items-center gap-3 px-4 py-3`}>
                    <div className="flex items-center gap-1 shrink-0">
                      <a.icon className={a.secondaryIcon ? 'h-5 w-5' : 'h-7 w-7'} />
                      {a.secondaryIcon && <a.secondaryIcon className="h-5 w-5" />}
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-ink" style={{ fontFamily: "'ChildsPlayground', cursive" }}>{a.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm overflow-hidden max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100 group-hover:mt-4 transition-all duration-300">{a.desc}</p>
                </Card>
              );
              if (a.popupImages) {
                return (
                  <Dialog key={i}>
                    <DialogTrigger asChild>
                      <button type="button" className="text-left">{cardInner}</button>
                    </DialogTrigger>
                    <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-0 overflow-hidden rounded-3xl border-0" style={{ backgroundColor: a.popupBg }}>
                      <div className="p-6 flex flex-col items-center text-center gap-5" style={{ backgroundColor: a.popupBg }}>
                        <Carousel className="w-full" opts={{ loop: true }}>
                          <CarouselContent>
                            {a.popupImages.map((src: string, idx: number) => (
                              <CarouselItem key={idx}>
                                <div className="w-full aspect-square rounded-2xl overflow-hidden">
                                  <img src={src} alt={`${a.title} ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                                </div>
                              </CarouselItem>
                            ))}
                          </CarouselContent>
                          <CarouselPrevious className="left-2" />
                          <CarouselNext className="right-2" />
                        </Carousel>
                        <DialogTitle className="text-3xl sm:text-4xl font-bold text-ink" style={{ fontFamily: "'ChildsPlayground', cursive" }}>{a.popupLabel || a.title}</DialogTitle>
                        <DialogDescription className="sr-only">{a.popupLabel || a.title}</DialogDescription>
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              }
              return <div key={i}>{cardInner}</div>;
            })}
          </div>
        </div>
      </section>

      {/* METODOLOGÍA */}
      <section id="metodologia" className="relative w-full overflow-hidden bg-background">
        <div className="relative z-10 container py-16">
          <div className="max-w-3xl mx-auto mb-10 text-center">
            <span className="font-bold uppercase tracking-wider text-sm bg-secondary text-primary-foreground px-3 py-2 rounded-sm">Proyecto Educativo</span>
            <h2 className="text-4xl sm:text-5xl text-ink mt-6 mb-6" style={{ fontFamily: "'ChildsPlayground', cursive" }}>Las experiencias educativas en SonSoles están dirigidas a desarrollar en los niños sus capacidades, talentos y sensibilidad como seres humanos.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Music, title: 'Música y Movimiento', image: metodologiaMusic, color: 'text-primary', bg: 'bg-primary/10', hoverBorder: 'hover:border-primary', popupBg: '#FFF3EA' },
              { icon: Palette, title: 'Arte y Creatividad', image: metodologiaArt, color: 'text-secondary', bg: 'bg-secondary/10', hoverBorder: 'hover:border-secondary', popupBg: '#E9F0FF', ringHsl: '217 96% 51%' },
              { icon: BookOpen, title: 'Lectoescritura', image: metodologiaRead, color: 'text-leaf', bg: 'bg-leaf/10', hoverBorder: 'hover:border-leaf', popupBg: '#EBF6ED', ringHsl: '144 99% 33%' },
            ].map((f, i) => (
              <Dialog key={i}>
                <DialogTrigger asChild>
                  <button type="button" className="text-left h-full">
                    <Card className={`p-5 rounded-3xl border-2 border-border ${f.hoverBorder} hover:-translate-y-1 transition-all flex flex-row items-center gap-4 w-full h-full cursor-pointer`}>
                      <div className={`${f.bg} ${f.color} w-14 h-14 rounded-2xl flex items-center justify-center shrink-0`}>
                        <f.icon className="h-7 w-7" />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-ink flex-1" style={{ fontFamily: "'ChildsPlayground', cursive" }}>{f.title}</h3>
                      <ChevronRight className={`h-6 w-6 ${f.color} shrink-0`} />
                    </Card>
                  </button>
                </DialogTrigger>
                <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-0 overflow-hidden rounded-3xl border-0" style={{ ...(f.popupBg ? { backgroundColor: f.popupBg } : {}), ...(f.ringHsl ? ({ ['--ring' as any]: f.ringHsl } as React.CSSProperties) : {}) }}>
                  <div className="p-6 flex flex-col items-center text-center gap-5" style={f.popupBg ? { backgroundColor: f.popupBg } : undefined}>
                    <div className="w-full aspect-square rounded-2xl overflow-hidden">
                      <img src={f.image} alt={f.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <DialogTitle className="text-3xl sm:text-4xl font-bold text-ink" style={{ fontFamily: "'ChildsPlayground', cursive" }}>{f.title}</DialogTitle>
                    <DialogDescription className="sr-only">{f.title}</DialogDescription>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
          <div className="mt-8">
            <Suspense fallback={null}><Performances /></Suspense>
          </div>
        </div>
      </section>

      {/* FACILIDADES */}
      <section id="facilidades" className="bg-secondary text-secondary-foreground py-24 relative overflow-hidden">
        <div className="container grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="font-bold uppercase tracking-wider text-sm opacity-80">nuestro preescolar es</span>
            <h2 className="text-4xl sm:text-5xl mt-3 mb-6">Un espacio diseñado para soñar en grande</h2>
            <p className="text-lg opacity-90 mb-8">Salones luminosos, áreas de juego seguras y rincones pensados para que cada niño explore, aprenda y se sienta feliz.</p>
            <ul className="grid sm:grid-cols-2 gap-4 mb-8">
              {['Aire acondicionado, planta eléctrica y cisterna de agua', 'Patio de juegos', 'Cocina propia, comida rica "estilo abuelita" balanceada y hecha con amor.', 'Salones limpios'].map((f) => (
                <li key={f} className="flex items-center gap-3 text-base">
                  <Apple className="h-5 w-5 text-accent flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Button asChild variant="sun" size="xl"><a href="#contacto">Visítanos</a></Button>
          </div>
          <div className="relative">
            <div className="relative w-full aspect-square rounded-[2rem] shadow-playful overflow-hidden">
              <div
                className="flex h-full w-full transition-transform duration-1000 ease-in-out"
                style={{ transform: `translateX(-${facilityIndex * 100}%)` }}
              >
                {facilityImages.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt="Facilidades del Preescolar SonSoles"
                    loading="lazy"
                    width={1280}
                    height={1280}
                    className="w-full h-full flex-shrink-0 object-cover"
                  />
                ))}
              </div>
            </div>
            <div className="absolute -top-5 -right-5 bg-accent text-accent-foreground rounded-2xl p-4 shadow-soft animate-float-slow">
              <div className="text-3xl font-black" style={{ fontFamily: "'Sour Gummy', sans-serif", fontWeight: 700 }}>+14</div>
              <div className="text-xs font-bold">Años educando </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section id="testimonios" className="py-24 bg-background">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="font-bold uppercase tracking-wider text-sm bg-secondary text-primary-foreground mx-[10px] my-[10px] px-[10px] py-[10px] rounded-sm">Testimonios</span>
            <h2 className="text-4xl sm:text-5xl text-ink mt-3" style={{ fontFamily: "'ChildsPlayground', cursive" }}>Deja que nuestros padres te cuenten.</h2>
            
          </div>
          <Suspense fallback={null}><VideoTestimonials /></Suspense>
          <div className="mt-16">
            <div className="elfsight-app-dea559c3-1a4d-4c55-b74d-28a786aa1094" data-elfsight-app-lazy></div>
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="bg-accent py-24">
        <div className="container grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl sm:text-5xl text-ink mb-5">¿Listo para conocer nuestra escuelita?</h2>
            <p className="text-ink/80 text-lg mb-8">Envíanos un breve mensaje y te orientaremos con los próximos pasos dentro de un día laboral.</p>
            <div className="elfsight-app-f6462d1d-0531-4524-91a2-7492f550169d" data-elfsight-app-lazy></div>
          </div>
          <div className="hidden lg:block relative">
            <img src={contactKids} alt="Niños de Sonsoles en el patio" loading="lazy" width={1280} height={1280} className="rounded-[2rem] shadow-playful w-full object-cover aspect-[4/5]" />
          </div>
        </div>
      </section>

      {/* MAP */}
      <section id="ubicacion" className="bg-muted py-20">
        <div className="container text-center max-w-4xl mb-10">
          <span className="font-bold uppercase tracking-wider text-sm bg-secondary text-primary-foreground mx-[10px] my-[10px] px-[10px] py-[10px] rounded-sm">Ubicación</span>
          <h2 className="text-4xl sm:text-5xl text-ink mt-5 mb-4" style={{ fontFamily: "'ChildsPlayground', cursive" }}>
            Visítanos en San Juan, Puerto Rico.<br />
            En el área de Cupey cerca de Los Paseos
          </h2>
          <p className="text-lg text-muted-foreground font-bold">Encuéntranos fácilmente en el mapa.</p>
        </div>
        <div className="container grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl overflow-hidden shadow-playful border-primary aspect-[16/9] border-0">
            <img
              src={sonsolesBuilding}
              alt="Edificio Preescolar SonSoles"
              loading="lazy"
              width={1920}
              height={1233}
              className="w-full h-full object-cover bg-primary border-0 border-primary-foreground"
            />
          </div>
          <div className="rounded-3xl overflow-hidden shadow-playful border-card aspect-[16/9] border-0 bg-card">
            {mapActive && deferredWidgetsReady ? (
              <iframe
                title="Ubicación Preescolar Sonsoles"
                src={GOOGLE_MAPS_EMBED_URL}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                onClick={() => setMapActive(true)}
                className="group relative h-full w-full overflow-hidden text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label="Cargar mapa interactivo de Google Maps"
              >
                <img
                  src={MAP_FACADE_IMAGE}
                  alt="Mapa estático de la ubicación de Preescolar SonSoles"
                  loading="lazy"
                  width={1280}
                  height={720}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-ink/45" aria-hidden="true" />
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-ink-foreground">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-playful transition-transform duration-300 group-hover:scale-110">
                    <Navigation className="h-7 w-7" />
                  </span>
                  <span className="text-2xl font-black" style={{ fontFamily: "'Sour Gummy', sans-serif", fontWeight: 800 }}>
                    {mapActive ? "Preparando mapa" : "Abrir ubicación"}
                  </span>
                  <span className="max-w-xs text-sm font-bold opacity-95">
                    Carretera 176 Km 4.2, Cupey Alto
                  </span>
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-ink text-ink-foreground py-12">
        <div className="container grid md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="" loading="lazy" width={48} height={48} className="h-12 w-12" />
              <span className="text-lg" style={{ fontFamily: "'SoupBone', serif", fontWeight: 600 }}>Preescolar SonSoles</span>
            </div>
            <p className="text-sm opacity-90">¡Nuestros Niños son Soles de Esperanza!</p>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-base">​</h4>
            <p className="text-sm opacity-95 flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0" /> Carretera 176 Km 4.2, Esquina Pío Baroja, Cupey Alto, Río Piedras (cerca de Los Paseos)</p>
            <p className="text-sm opacity-95 flex items-start gap-2 mt-2"><Clock className="h-4 w-4 mt-0.5 shrink-0" /> Horario: 8:00 am – 1:00 pm (extendido hasta 4:00 pm)</p>
            <p className="text-sm opacity-95 flex items-center gap-2 mt-2"><Phone className="h-4 w-4 shrink-0" /> (787) 993-5623</p>
            <a href="mailto:preescolarsonsoles@gmail.com" className="text-sm opacity-95 hover:opacity-100 hover:text-primary transition-colors flex items-center gap-2 mt-2 break-all"><Mail className="h-4 w-4 shrink-0" /> preescolarsonsoles@gmail.com</a>
          </div>
          <div>
            <h4 className="font-bold mb-3 text-base">Síguenos</h4>
            <div className="flex gap-3">
              <a href="https://www.instagram.com/preescolarsonsoles" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="bg-card/10 hover:bg-primary p-2.5 rounded-full transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="https://www.facebook.com/preschoolsonsoles" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="bg-card/10 hover:bg-secondary p-2.5 rounded-full transition-colors"><Facebook className="h-5 w-5" /></a>
            </div>
          </div>
          <Suspense fallback={null}><NewsletterForm /></Suspense>
        </div>
        <div className="container mt-10 pt-6 border-t border-white/20 text-xs opacity-90 text-center">
          © {new Date().getFullYear()} Preescolar SonSoles. Todos los derechos reservados. · Designed by <a href="https://depictbrands.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline-offset-2 hover:underline">DepictBrands</a>
        </div>
      </footer>

      {deferredWidgetsReady && <Suspense fallback={null}><WhatsAppChat /></Suspense>}
    </div>
  );
};

export default Index;
