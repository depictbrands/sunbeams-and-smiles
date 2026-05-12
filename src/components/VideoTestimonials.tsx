import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

import video1 from "@/assets/testimonial-1.mp4";
import video2 from "@/assets/testimonial-2.mp4";
import video3 from "@/assets/testimonial-3.mp4";
import video4 from "@/assets/testimonial-4.mp4";
type VideoTestimonial = { videoUrl: string; color: string };

const testimonials: VideoTestimonial[] = [
  { videoUrl: video1, color: "#FF7E1D" },
  { videoUrl: video2, color: "#FFCE00" },
  { videoUrl: video3, color: "#00A4FF" },
  { videoUrl: video4, color: "#01A652" },
];

// Inactive slides keep their original (narrow) aspect ratio.
// Active/hovered slide scales up to a 720:1280 (9:16) portrait ratio.
const SIDE_RATIO = "6.81444 / 41.57488";
const ACTIVE_RATIO = "720 / 1280";
const RADIUS = "1.5rem";

const VideoTestimonials = () => {
  const [active, setActive] = useState(0);
  const [unmutedIdx, setUnmutedIdx] = useState<number | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();
  const isSyncingScroll = useRef(false);

  // Play active video, pause others
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === active) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
    setUnmutedIdx(null);
  }, [active]);

  // Helper: scroll a given slide index into view (centered)
  const centerSlide = (idx: number, behavior: ScrollBehavior = "smooth") => {
    const el = slideRefs.current[idx];
    const scroller = scrollerRef.current;
    if (!el || !scroller) return;
    isSyncingScroll.current = true;
    const target = el.offsetLeft - (scroller.clientWidth - el.clientWidth) / 2;
    scroller.scrollTo({ left: Math.max(0, target), behavior });
    window.setTimeout(() => { isSyncingScroll.current = false; }, 650);
  };

  // On mobile: scroll the active slide into view (centered) when active changes.
  // Wait for the width transition (duration-500) to finish so offsets are correct.
  useEffect(() => {
    if (!isMobile) return;
    // Initial pass on next frame (handles first render)
    const raf = requestAnimationFrame(() => centerSlide(active, "auto"));
    // Final pass after the slide-width transition completes
    const t1 = window.setTimeout(() => centerSlide(active, "smooth"), 80);
    const t2 = window.setTimeout(() => centerSlide(active, "smooth"), 550);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, isMobile]);

  // On mobile: update active when user swipes (one slide per gesture)
  useEffect(() => {
    if (!isMobile) return;
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let touchStartX = 0;
    let touchStartScrollLeft = 0;
    let activeAtTouchStart = 0;
    let gestureLocked = false;

    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartScrollLeft = scroller.scrollLeft;
      activeAtTouchStart = active;
      gestureLocked = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (gestureLocked) {
        e.preventDefault();
        return;
      }
      const dx = e.touches[0].clientX - touchStartX;
      const maxTravel = (slideRefs.current[activeAtTouchStart]?.clientWidth ?? 0) * 0.9 + 16;
      if (Math.abs(dx) > maxTravel) {
        gestureLocked = true;
      }
    };

    const onTouchEnd = () => {
      if (isSyncingScroll.current) return;
      const dx = scroller.scrollLeft - touchStartScrollLeft;
      const threshold = 30;
      let target = activeAtTouchStart;
      if (dx > threshold) target = Math.min(testimonials.length - 1, activeAtTouchStart + 1);
      else if (dx < -threshold) target = Math.max(0, activeAtTouchStart - 1);
      // Always re-center, even if target index didn't change (snap may have left it off-center)
      if (target === active) {
        centerSlide(target, "smooth");
      } else {
        setActive(target);
      }
    };

    scroller.addEventListener("touchstart", onTouchStart, { passive: true });
    scroller.addEventListener("touchmove", onTouchMove, { passive: false });
    scroller.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      scroller.removeEventListener("touchstart", onTouchStart);
      scroller.removeEventListener("touchmove", onTouchMove);
      scroller.removeEventListener("touchend", onTouchEnd);
    };
  }, [isMobile, active]);

  const toggleSound = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRefs.current[idx];
    if (!v) return;
    if (unmutedIdx === idx) {
      v.muted = true;
      setUnmutedIdx(null);
    } else {
      // Mute all others
      videoRefs.current.forEach((other, i) => {
        if (other && i !== idx) other.muted = true;
      });
      v.muted = false;
      v.play().catch(() => {});
      setUnmutedIdx(idx);
      setActive(idx);
    }
  };

  const total = testimonials.length;
  const prev = () => setActive((i) => (i - 1 + total) % total);
  const next = () => setActive((i) => (i + 1) % total);

  return (
    <section id="testimonios-video" className="pb-12 relative overflow-hidden">
      <div className="container">

        <div className="relative">
          <div
            ref={scrollerRef}
            className="overflow-x-auto sm:overflow-visible scrollbar-hide snap-x snap-mandatory sm:snap-none overscroll-x-contain -mx-4 sm:mx-0"
          >
            <div className="flex items-center gap-3 sm:gap-4 sm:justify-center sm:w-auto sm:px-2 mx-auto">
              {testimonials.map(({ videoUrl, color }, idx) => {
                const isActive = idx === active;
                const mobileActiveWidth = "80vw";
                const mobileInactiveWidth = "18vw";
                return (
                  <div
                    key={idx}
                    ref={(el) => (slideRefs.current[idx] = el)}
                    onMouseEnter={() => !isMobile && setActive(idx)}
                    onClick={() => setActive(idx)}
                    role="button"
                    aria-label={`Testimonio ${idx + 1}`}
                    className="relative overflow-hidden flex-shrink-0 cursor-pointer transition-all duration-500 ease-out shadow-playful h-[55vh] sm:h-[70vh] md:h-[75vh] max-h-[80vh] snap-center first:ml-[10vw] last:mr-[10vw] sm:first:ml-0 sm:last:mr-0"
                    style={{
                      width: isMobile ? (isActive ? mobileActiveWidth : mobileInactiveWidth) : undefined,
                      aspectRatio: isMobile ? undefined : (isActive ? ACTIVE_RATIO : SIDE_RATIO),
                      borderRadius: RADIUS,
                      scrollSnapStop: "always",
                    } as React.CSSProperties}
                  >
                    {isActive && (
                      <video
                        ref={(el) => (videoRefs.current[idx] = el)}
                        src={videoUrl}
                        muted
                        playsInline
                        loop
                        preload="metadata"
                        autoPlay
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    {!isActive && (
                      <div
                        aria-label={`Testimonio ${idx + 1}`}
                        className="absolute inset-0 w-full h-full"
                        style={{ backgroundColor: color }}
                      />
                    )}
                    <button
                      onClick={(e) => toggleSound(idx, e)}
                      aria-label={unmutedIdx === idx ? "Silenciar" : "Activar sonido"}
                      className="absolute bottom-3 right-3 z-10 bg-card/60 hover:bg-card/80 text-ink rounded-full p-2 backdrop-blur-sm transition-colors"
                    >
                      {unmutedIdx === idx ? (
                        <Volume2 className="h-4 w-4" />
                      ) : (
                        <VolumeX className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              aria-label="Anterior"
              className="bg-card hover:bg-primary hover:text-primary-foreground text-ink rounded-full p-3 shadow-soft transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1.5">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === active ? "w-8 bg-primary" : "w-2 bg-ink/20 hover:bg-ink/40"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={next}
              aria-label="Siguiente"
              className="bg-card hover:bg-primary hover:text-primary-foreground text-ink rounded-full p-3 shadow-soft transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoTestimonials;
