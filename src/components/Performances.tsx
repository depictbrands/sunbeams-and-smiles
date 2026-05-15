import { useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

import diaDeJuegos from "@/assets/3rdVersion-DiadeJuegos-compressed.mp4";

type Performance = {
  title: string;
  description: string;
  videoUrl: string;
};

const performances: Performance[] = [
  {
    title: "Día de Juegos",
    description:
      "Un día familiar, lleno de risas y muuuuucho movimiento.",
    videoUrl: diaDeJuegos,
  },
];

const PerformanceCard = ({ item }: { item: Performance }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <div className="group relative rounded-3xl overflow-hidden shadow-playful bg-card">
      <div className="relative aspect-video w-full">
        {item.videoUrl ? (
          <video
            ref={videoRef}
            src={item.videoUrl}
            muted={muted}
            playsInline
            loop
            autoPlay
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-ink text-card text-sm">
            Video pendiente de subir
          </div>
        )}

        {item.videoUrl && (
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
            <button
              onClick={toggleMute}
              aria-label={muted ? "Activar sonido" : "Silenciar"}
              className="bg-card/60 hover:bg-card/80 text-ink rounded-full p-3 shadow-playful backdrop-blur-sm transition-colors"
            >
              {muted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={togglePlay}
              aria-label={playing ? "Pausar" : "Reproducir"}
              className="bg-card/60 hover:bg-card/80 text-ink rounded-full p-3 shadow-playful backdrop-blur-sm transition-colors"
            >
              {playing ? (
                <Pause className="h-5 w-5 fill-ink" />
              ) : (
                <Play className="h-5 w-5 fill-ink" />
              )}
            </button>
          </div>
        )}
      </div>

      <div className="p-6 sm:p-7 bg-card">
        <h3
          className="text-2xl sm:text-3xl text-ink mb-2"
          style={{ fontFamily: "'ChildsPlayground', cursive" }}
        >
          {item.title}
        </h3>
        <p className="text-muted-foreground text-sm sm:text-base">
          {item.description}
        </p>
      </div>
    </div>
  );
};

const Performances = () => {
  return (
    <section id="presentaciones" className="bg-background">
      <div>
        <div className="grid md:grid-cols-2 gap-8 justify-items-center">
          {performances.map((item) => (
            <PerformanceCard key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Performances;
