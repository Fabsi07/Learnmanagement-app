"use client";

import { useCallback, useEffect, useState } from "react";
import type { CalEvent } from "@/components/calendar/events";

type ApiEvent = Omit<CalEvent, "start" | "end"> & {
  start: string;
  end: string;
};

export function useExternalEvents() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/calendar/external", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { events: ApiEvent[] };
      setEvents(
        data.events.map((e) => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end),
        }))
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { events, loading, error, refresh };
}
