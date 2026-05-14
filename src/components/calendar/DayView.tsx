"use client";

import { isSameDay } from "./utils";
import {
  CalEvent,
  DAY_START_HOUR,
  DAY_END_HOUR,
  HOUR_HEIGHT,
  eventOnDay,
  layoutDayEvents,
} from "./events";
import { EventBlock } from "./EventBlock";
import { AllDayBar } from "./AllDayBar";

interface DayViewProps {
  currentDate: Date;
  events: CalEvent[];
  onEventChange: (next: CalEvent) => void;
}

const HOURS = Array.from(
  { length: DAY_END_HOUR - DAY_START_HOUR },
  (_, i) => i + DAY_START_HOUR
);

export function DayView({ currentDate, events, onEventChange }: DayViewProps) {
  const today = new Date();
  const isToday = isSameDay(currentDate, today);
  const totalHeight = HOURS.length * HOUR_HEIGHT;
  const dayEvents = events.filter((e) => !e.allDay && eventOnDay(e, currentDate));

  return (
    <div className="flex flex-col h-full">
      {/* Header: Tag */}
      <div className="grid grid-cols-[64px_1fr] border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="border-r border-gray-200" />
        <div className="px-4 py-3 text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][currentDate.getDay()]}
          </div>
          <div
            className={`mt-1 inline-flex items-center justify-center w-9 h-9 rounded-full text-sm ${
              isToday ? "bg-brand-red text-white font-bold" : "text-gray-900"
            }`}
          >
            {currentDate.getDate()}
          </div>
        </div>
      </div>

      {/* All-Day-Leiste */}
      <AllDayBar days={[currentDate]} events={events} />

      {/* Body: Zeit-Spalte + Tages-Spalte */}
      <div className="grid grid-cols-[64px_1fr]">
        {/* Zeit-Spalte */}
        <div className="border-r border-gray-200" style={{ height: totalHeight }}>
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="px-2 py-1 text-xs text-gray-500 text-right"
              style={{ height: HOUR_HEIGHT }}
            >
              {hour}:00
            </div>
          ))}
        </div>

        {/* Tages-Spalte mit Events */}
        <div className="relative" style={{ height: totalHeight }}>
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="border-b border-gray-200 hover:bg-gray-50/60 transition-colors"
              style={{ height: HOUR_HEIGHT }}
            />
          ))}
          {layoutDayEvents(dayEvents).map(({ event: ev, column, columns }) => (
            <EventBlock
              key={ev.id}
              event={ev}
              onChange={onEventChange}
              column={column}
              columns={columns}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
