"use client";

import type { CalEvent } from "./events";
import { eventOverlapsDay } from "./events";

interface AllDayBarProps {
  days: Date[];
  events: CalEvent[];
}

/**
 * Schmale Zeile über dem Stundenraster für ganztägige / mehrtägige Events
 * (z. B. Feiertage, Ferien). Beeinflusst das Stundenraster nicht und lässt
 * den Tag für Lernzeiten frei.
 */
export function AllDayBar({ days, events }: AllDayBarProps) {
  const allDay = events.filter((e) => e.allDay);
  if (allDay.length === 0) return null;

  return (
    <div className="grid border-b border-gray-200 bg-gray-50/50" style={{ gridTemplateColumns: `64px repeat(${days.length}, 1fr)` }}>
      <div className="border-r border-gray-200 px-2 py-1 text-[10px] uppercase tracking-wider text-gray-500 text-right">
        Ganztägig
      </div>
      {days.map((day, i) => {
        const dayEvents = allDay.filter((e) => eventOverlapsDay(e, day));
        return (
          <div
            key={i}
            className="border-r border-gray-200 last:border-r-0 px-1 py-1 min-h-[28px] space-y-0.5"
          >
            {dayEvents.map((ev) => (
              <div
                key={ev.id}
                title={ev.title}
                className={`${ev.color} text-white text-[11px] leading-tight rounded px-1.5 py-0.5 truncate opacity-90`}
              >
                {ev.title}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
