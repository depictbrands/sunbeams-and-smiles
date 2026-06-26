import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DOW = ["L", "M", "X", "J", "V", "S", "D"];

const getMonthGrid = (year: number, month: number) => {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday = 0
  const startDow = (first.getDay() + 6) % 7;
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

const MonthMini = ({ year, month, today }: { year: number; month: number; today: Date }) => {
  const cells = getMonthGrid(year, month);
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  return (
    <div className="rounded-xl border-2 p-3 bg-card">
      <h4 className="font-bold text-ink text-sm mb-2 text-center">{MONTHS[month]}</h4>
      <div className="grid grid-cols-7 gap-0.5 text-[10px] text-muted-foreground mb-1">
        {DOW.map((d) => (
          <div key={d} className="text-center font-semibold">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          const isToday = isCurrentMonth && d === today.getDate();
          return (
            <div
              key={i}
              className={`text-[11px] text-center py-1 rounded ${
                d === null
                  ? ""
                  : isToday
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-ink hover:bg-muted"
              }`}
            >
              {d ?? ""}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const YearCalendar = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setYear((y) => y - 1)}>
          <ChevronLeft className="h-4 w-4" />
          {year - 1}
        </Button>
        <h3 className="text-2xl font-bold text-ink">{year}</h3>
        <Button variant="outline" size="sm" onClick={() => setYear((y) => y + 1)}>
          {year + 1}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {MONTHS.map((_, m) => (
          <MonthMini key={m} year={year} month={m} today={today} />
        ))}
      </div>
    </div>
  );
};

export default YearCalendar;
