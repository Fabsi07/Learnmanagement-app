// Event-Typen, Dummy-Daten und Helfer für den Kalender

export type CalEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string; // tailwind bg classes, z.B. "bg-brand-red"
};

// Layout-Konstanten (müssen mit den Views übereinstimmen)
export const DAY_START_HOUR = 7;
export const DAY_END_HOUR = 21; // exclusive Ende → 14 Stunden sichtbar
export const HOUR_HEIGHT = 64; // px (= h-16)
export const SNAP_MIN = 15; // Snap-Raster in Minuten
export const MIN_EVENT_MIN = 30; // Mindestdauer eines Termins in Minuten

/** Erzeugt ein Datum am gegebenen Tag mit Stunde+Minute. */
function at(base: Date, h: number, m: number): Date {
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

/** Liefert ein paar Dummy-Events relativ zu „heute" für schnelles Testen. */
export function getDummyEvents(): CalEvent[] {
  const today = new Date();
  const monday = new Date(today);
  const day = monday.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const d = (offset: number) => {
    const x = new Date(monday);
    x.setDate(monday.getDate() + offset);
    return x;
  };

  return [
    {
      id: "1",
      title: "Mathe Vorlesung",
      start: at(d(0), 8, 0),
      end: at(d(0), 9, 30),
      color: "bg-brand-red",
    },
    {
      id: "2",
      title: "Lerngruppe BWL",
      start: at(d(0), 14, 0),
      end: at(d(0), 15, 30),
      color: "bg-blue-500",
    },
    {
      id: "3",
      title: "Programmieren Übung",
      start: at(d(1), 10, 0),
      end: at(d(1), 12, 0),
      color: "bg-emerald-500",
    },
    {
      id: "4",
      title: "Prüfungsvorbereitung",
      start: at(d(2), 9, 0),
      end: at(d(2), 11, 0),
      color: "bg-amber-500",
    },
    {
      id: "5",
      title: "Statistik Klausur",
      start: at(d(3), 13, 0),
      end: at(d(3), 14, 30),
      color: "bg-brand-red",
    },
    {
      id: "6",
      title: "Sprechstunde Prof.",
      start: at(d(4), 11, 0),
      end: at(d(4), 11, 45),
      color: "bg-purple-500",
    },
    {
      id: "7",
      title: "Sport",
      start: at(d(today.getDay() === 0 ? -1 : 0), 17, 0),
      end: at(d(today.getDay() === 0 ? -1 : 0), 18, 30),
      color: "bg-blue-500",
    },
    // Beispiele für überlappende Termine (zwei parallele Slots am Mittwoch)
    {
      id: "8",
      title: "Tutorium Analysis",
      start: at(d(2), 14, 0),
      end: at(d(2), 15, 30),
      color: "bg-blue-500",
    },
    {
      id: "9",
      title: "Projektmeeting",
      start: at(d(2), 14, 30),
      end: at(d(2), 16, 0),
      color: "bg-emerald-500",
    },
  ];
}

/** True, wenn ein Event ganz oder teilweise an diesem Tag liegt. */
export function eventOnDay(ev: CalEvent, day: Date): boolean {
  return (
    ev.start.getFullYear() === day.getFullYear() &&
    ev.start.getMonth() === day.getMonth() &&
    ev.start.getDate() === day.getDate()
  );
}

/** Minuten ab DAY_START_HOUR (kann negativ / >range sein, Caller clampt). */
export function minutesFromDayStart(date: Date): number {
  return (date.getHours() - DAY_START_HOUR) * 60 + date.getMinutes();
}

/** px-Position (top) eines Datums innerhalb der Stunden-Spalte. */
export function dateToTop(date: Date): number {
  return (minutesFromDayStart(date) / 60) * HOUR_HEIGHT;
}

/** px-Höhe für eine Dauer in Minuten. */
export function durationToHeight(startMs: number, endMs: number): number {
  const minutes = (endMs - startMs) / 60000;
  return (minutes / 60) * HOUR_HEIGHT;
}

/** Rundet eine Minutenzahl auf SNAP_MIN. */
export function snapMinutes(min: number): number {
  return Math.round(min / SNAP_MIN) * SNAP_MIN;
}

/** hh:mm Zeitformat. */
export function formatTime(d: Date): string {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Spalten-Layout für Events innerhalb eines Tages.
 *
 * Greedy column packing: Sortiere nach Startzeit; bilde Cluster aus transitiv
 * überlappenden Events; jedes Event bekommt die niedrigste freie Spalte
 * innerhalb seines Clusters. Am Ende kennt jedes Event `column` und `columns`
 * (Gesamtanzahl Spalten im Cluster) – damit kann ein Block in der Tages-Spalte
 * horizontal nebeneinander gerendert werden, statt sich zu überlagern.
 */
export type EventLayout = {
  event: CalEvent;
  column: number;
  columns: number;
};

export function layoutDayEvents(events: CalEvent[]): EventLayout[] {
  const sorted = [...events].sort((a, b) => {
    const d = a.start.getTime() - b.start.getTime();
    return d !== 0 ? d : a.end.getTime() - b.end.getTime();
  });

  const result: EventLayout[] = [];
  let cluster: EventLayout[] = [];
  let clusterEnd = 0;

  function flushCluster() {
    const cols = cluster.reduce((m, it) => Math.max(m, it.column + 1), 0);
    cluster.forEach((it) => {
      it.columns = cols;
    });
    result.push(...cluster);
    cluster = [];
    clusterEnd = 0;
  }

  for (const ev of sorted) {
    // Neuer Cluster, wenn dieses Event nach dem bisherigen Cluster-Ende beginnt
    if (cluster.length > 0 && ev.start.getTime() >= clusterEnd) {
      flushCluster();
    }
    // Belegte Spalten unter den noch aktiven (überlappenden) Items im Cluster
    const used = new Set(
      cluster
        .filter((it) => it.event.end.getTime() > ev.start.getTime())
        .map((it) => it.column)
    );
    let col = 0;
    while (used.has(col)) col++;
    cluster.push({ event: ev, column: col, columns: 1 });
    clusterEnd = Math.max(clusterEnd, ev.end.getTime());
  }
  flushCluster();
  return result;
}
