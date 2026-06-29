import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type EventType = "inicio" | "feriado" | "graduacion" | "actividad" | "pago" | "fin";

interface SchoolEvent {
  date: string; // YYYY-MM-DD
  endDate?: string; // optional range end inclusive
  title: string;
  type: EventType;
}

// Academic Year 2026-2027 — extracted from the official school calendar
const EVENTS: SchoolEvent[] = [
  // August 2026
  { date: "2026-08-03", title: "Inician labores docentes (oficina cerrada)", type: "actividad" },
  { date: "2026-08-04", title: "Desarrollo profesional — oficina cerrada", type: "actividad" },
  { date: "2026-08-05", title: "Oficina abrirá", type: "actividad" },
  { date: "2026-08-10", title: "Open House & Reunión Inicial", type: "actividad" },
  { date: "2026-08-11", title: "🎒 Comienzo de clases — todos los niveles", type: "inicio" },
  { date: "2026-08-17", title: "Último día para pagar cuotas de agosto sin recargo", type: "pago" },

  // September
  { date: "2026-09-07", title: "Feriado — Día del Trabajo", type: "feriado" },
  { date: "2026-09-08", title: "Último día para pagar mensualidad sin recargo", type: "pago" },
  { date: "2026-09-16", title: "Primera Escuela de Padres", type: "actividad" },

  // October — Mes del Rosario
  { date: "2026-10-01", title: "Inician citas de preceptorías", type: "actividad" },
  { date: "2026-10-05", title: "Último día para pagar mensualidad sin recargo", type: "pago" },
  { date: "2026-10-12", title: "Feriado — Día de la Raza", type: "feriado" },
  { date: "2026-10-21", title: "Escuela de Padres", type: "actividad" },
  { date: "2026-10-30", title: "Cierre del mes del Rosario · Salida temprana", type: "actividad" },

  // November
  { date: "2026-11-05", title: "Último día para pagar mensualidad sin recargo", type: "pago" },
  { date: "2026-11-11", title: "Feriado — Día del Veterano", type: "feriado" },
  { date: "2026-11-23", endDate: "2026-11-27", title: "Receso — Acción de Gracias", type: "feriado" },
  { date: "2026-11-30", title: "Se reanudan las clases", type: "actividad" },

  // December
  { date: "2026-12-03", title: "Salida temprana — Montaje Programa de Navidad", type: "actividad" },
  { date: "2026-12-04", title: "Ensayo general — Programa de Navidad", type: "actividad" },
  { date: "2026-12-05", endDate: "2026-12-06", title: "🎄 Programa de Navidad", type: "actividad" },
  { date: "2026-12-07", title: "Concedido — no habrá clases", type: "feriado" },
  { date: "2026-12-08", title: "Último día para pagar mensualidad sin recargo", type: "pago" },
  { date: "2026-12-17", title: "Fiesta de Navidad · Último día de clases (salida temprana)", type: "fin" },
  { date: "2026-12-18", endDate: "2027-01-07", title: "Receso de Navidad", type: "feriado" },

  // January 2027
  { date: "2027-01-08", title: "Se reanudan labores docentes", type: "actividad" },
  { date: "2027-01-11", title: "Comienzo de clases — todos los grupos", type: "inicio" },
  { date: "2027-01-18", title: "Feriado — Natalicio de Martin Luther King Jr.", type: "feriado" },

  // February
  { date: "2027-02-01", endDate: "2027-02-26", title: "Proceso de matrícula 2027-2028", type: "actividad" },
  { date: "2027-02-05", title: "Último día para pagar mensualidad sin recargo", type: "pago" },
  { date: "2027-02-12", title: "Valentine's Day — Casual Day", type: "actividad" },
  { date: "2027-02-15", title: "Feriado — Día de los Presidentes", type: "feriado" },
  { date: "2027-02-19", title: "🎈 Día de Juegos (9:00 a.m. – 12:00 p.m.)", type: "actividad" },
  { date: "2027-02-24", title: "Escuela de Padres", type: "actividad" },

  // March
  { date: "2027-03-01", title: "Inician citas de preceptorías", type: "actividad" },
  { date: "2027-03-05", title: "Desarrollo Profesional · Salida temprana · Pago de mensualidad", type: "actividad" },
  { date: "2027-03-06", title: "Family Day (tentativo)", type: "actividad" },
  { date: "2027-03-10", title: "Escuela de Padres (virtual)", type: "actividad" },
  { date: "2027-03-22", endDate: "2027-03-29", title: "Receso de Semana Santa", type: "feriado" },
  { date: "2027-03-30", title: "Se reanudan las clases · Easter Egg Hunt", type: "actividad" },

  // April
  { date: "2027-04-05", title: "Último día para pagar mensualidad sin recargo", type: "pago" },
  { date: "2027-04-16", title: "Clase Demostrativa: Let's Explore Music (Prekínder)", type: "actividad" },

  // May — Mes de la Virgen María
  { date: "2027-05-05", title: "Último día para pagar mensualidad sin recargo", type: "pago" },
  { date: "2027-05-06", title: "Día del Estudiante · Casual Day · Salida temprana", type: "actividad" },
  { date: "2027-05-07", title: "Día del Maestro — no habrá clases", type: "feriado" },
  { date: "2027-05-10", endDate: "2027-05-14", title: "Fecha límite pago Verano en SonSoles", type: "pago" },
  { date: "2027-05-14", title: "Ensayo general — Graduación de Prekínder (no hay clases)", type: "actividad" },
  { date: "2027-05-15", title: "🎓 Graduación de Prekínder", type: "graduacion" },
  { date: "2027-05-17", title: "Prekínder — Fiestecita de fin de curso (salida 12:30 p.m.)", type: "fin" },
  { date: "2027-05-19", title: "Cierre Nivel Maternal — Último día de clases", type: "fin" },
  { date: "2027-05-20", title: "Cierre Preescolares 3 — Último día de clases", type: "fin" },
  { date: "2027-05-31", title: "Feriado — Memorial Day", type: "feriado" },

  // June — Verano
  { date: "2027-06-30", title: "Culminan labores docentes y administrativas", type: "fin" },
];

const TYPE_STYLES: Record<EventType, { dot: string; chip: string; label: string }> = {
  inicio:     { dot: "bg-emerald-500",  chip: "bg-emerald-100 text-emerald-800 border-emerald-300",  label: "Inicio de clases" },
  feriado:    { dot: "bg-rose-500",     chip: "bg-rose-100 text-rose-800 border-rose-300",           label: "Feriado / Receso" },
  graduacion: { dot: "bg-amber-500",    chip: "bg-amber-100 text-amber-900 border-amber-300",        label: "Graduación" },
  actividad:  { dot: "bg-sky-500",      chip: "bg-sky-100 text-sky-800 border-sky-300",              label: "Actividad" },
  pago:       { dot: "bg-violet-500",   chip: "bg-violet-100 text-violet-800 border-violet-300",     label: "Pagos" },
  fin:        { dot: "bg-orange-500",   chip: "bg-orange-100 text-orange-900 border-orange-300",     label: "Último día / Cierre" },
};

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DOW = ["L", "M", "X", "J", "V", "S", "D"];

const SCHOOL_YEAR: { year: number; month: number }[] = [
  { year: 2026, month: 7 }, // Aug
  { year: 2026, month: 8 },
  { year: 2026, month: 9 },
  { year: 2026, month: 10 },
  { year: 2026, month: 11 },
  { year: 2027, month: 0 }, // Jan
  { year: 2027, month: 1 },
  { year: 2027, month: 2 },
  { year: 2027, month: 3 },
  { year: 2027, month: 4 },
  { year: 2027, month: 5 },
  { year: 2027, month: 6 },
];

const ymd = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const getMonthGrid = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = (first.getDay() + 6) % 7; // Monday = 0
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

const eventsForDate = (events: SchoolEvent[], dateStr: string) =>
  events.filter((e) => {
    if (!e.endDate) return e.date === dateStr;
    return dateStr >= e.date && dateStr <= e.endDate;
  });

const Month = ({
  year,
  month,
  events,
  today,
  onSelect,
}: {
  year: number;
  month: number;
  events: SchoolEvent[];
  today: Date;
  onSelect: (dateStr: string) => void;
}) => {
  const cells = getMonthGrid(year, month);
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  return (
    <Card className="p-3 rounded-2xl border-2">
      <h4 className="font-bold text-ink text-sm mb-2 text-center">
        {MONTHS_ES[month]} <span className="text-muted-foreground font-normal">{year}</span>
      </h4>
      <div className="grid grid-cols-7 gap-0.5 text-[10px] text-muted-foreground mb-1">
        {DOW.map((d) => (
          <div key={d} className="text-center font-semibold">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const dateStr = ymd(year, month, d);
          const dayEvents = eventsForDate(events, dateStr);
          const top = dayEvents[0];
          const isToday = isCurrentMonth && d === today.getDate();
          const dotColor = top ? TYPE_STYLES[top.type].dot : "";

          const cell = (
            <button
              type="button"
              onClick={() => dayEvents.length && onSelect(dateStr)}
              className={`relative text-[11px] w-full aspect-square rounded-md flex items-center justify-center transition-all ${
                isToday
                  ? "bg-primary text-primary-foreground font-bold ring-2 ring-primary/40"
                  : top
                    ? "text-ink font-semibold hover:bg-muted"
                    : "text-ink hover:bg-muted"
              }`}
              aria-label={dayEvents.length ? `${d} — ${top.title}` : `${d}`}
            >
              {d}
              {top && (
                <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1.5 w-1.5 rounded-full ${dotColor}`} />
              )}
            </button>
          );

          return top ? (
            <Tooltip key={i} delayDuration={150}>
              <TooltipTrigger asChild>{cell}</TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px]">
                <ul className="space-y-1">
                  {dayEvents.map((e, idx) => (
                    <li key={idx} className="text-xs">
                      <span className={`inline-block h-2 w-2 rounded-full mr-1.5 align-middle ${TYPE_STYLES[e.type].dot}`} />
                      {e.title}
                    </li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div key={i}>{cell}</div>
          );
        })}
      </div>
    </Card>
  );
};

const AcademicYearCalendar = () => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const sortedEvents = useMemo(
    () => [...EVENTS].sort((a, b) => a.date.localeCompare(b.date)),
    [],
  );

  const upcoming = useMemo(() => {
    const todayStr = ymd(today.getFullYear(), today.getMonth(), today.getDate());
    return sortedEvents.filter((e) => (e.endDate ?? e.date) >= todayStr).slice(0, 6);
  }, [sortedEvents, today]);

  return (
    <TooltipProvider>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-bold text-ink text-lg">Año académico 2026 – 2027</h3>
            <p className="text-sm text-muted-foreground">
              Pasa el cursor o toca un día marcado para ver los detalles del evento.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.values(TYPE_STYLES).map((s) => (
              <Badge key={s.label} variant="outline" className={`${s.chip} border`}>
                <span className={`h-2 w-2 rounded-full mr-1.5 ${s.dot}`} />
                {s.label}
              </Badge>
            ))}
          </div>
        </div>

        {upcoming.length > 0 && (
          <Card className="p-4 rounded-2xl border-2 bg-gradient-to-br from-primary/5 to-secondary/5">
            <h4 className="font-bold text-ink mb-3">Próximos eventos</h4>
            <ul className="space-y-2">
              {upcoming.map((e, i) => {
                const d = new Date(e.date + "T12:00:00");
                const label = d.toLocaleDateString("es-PR", { weekday: "short", day: "numeric", month: "short" });
                return (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${TYPE_STYLES[e.type].dot}`} />
                    <div className="min-w-0">
                      <span className="font-semibold text-ink capitalize">{label}</span>
                      {e.endDate && (
                        <span className="text-muted-foreground"> — {new Date(e.endDate + "T12:00:00").toLocaleDateString("es-PR", { day: "numeric", month: "short" })}</span>
                      )}
                      <span className="text-ink/80"> · {e.title}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {SCHOOL_YEAR.map(({ year, month }) => (
            <Month
              key={`${year}-${month}`}
              year={year}
              month={month}
              events={EVENTS}
              today={today}
              onSelect={setSelectedDate}
            />
          ))}
        </div>

        {selectedDate && (
          <Card className="p-4 rounded-2xl border-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-ink">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString("es-PR", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
              </h4>
              <button
                className="text-xs text-muted-foreground hover:text-ink"
                onClick={() => setSelectedDate(null)}
              >
                Cerrar
              </button>
            </div>
            <ul className="space-y-1.5">
              {eventsForDate(EVENTS, selectedDate).map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${TYPE_STYLES[e.type].dot}`} />
                  <span className="text-ink">{e.title}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default AcademicYearCalendar;
