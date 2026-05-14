import { NextResponse } from "next/server";
import * as ical from "node-ical";
import { mapIcsToCalEvents } from "@/lib/calendar/icsMapper";
import type { CalEvent } from "@/components/calendar/events";

// TODO: Sobald das DB-Schema steht, hier die CalendarSources des Users laden.
// Bis dahin: hardcoded Default-URL (DHBW Lörrach TIF25A).
const DEFAULT_ICS_URL =
  "https://webmail.dhbw-loerrach.de/owa/calendar/kal-tif25a%40dhbw-loerrach.de/Kalender/calendar.ics";

const FETCH_TIMEOUT_MS = 8000;
const MAX_RETRIES = 4;
const RETRY_DELAY_MS = 500;

// Module-scoped Fallback-Cache: Falls der OWA-Server gerade 500 zurückgibt,
// liefern wir das letzte erfolgreich geparste Ergebnis – damit der Kalender
// nicht plötzlich leer ist, wenn der Upstream wackelt.
// Wir hängen den Cache an globalThis, damit er HMR-Reloads (next dev) überlebt.
type CacheEntry = { events: CalEvent[]; fetchedAt: number };
type CacheStore = Map<string, CacheEntry>;
const g = globalThis as unknown as { __icsCache?: CacheStore };
const memoryCache: CacheStore = g.__icsCache ?? new Map();
g.__icsCache = memoryCache;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchIcsWithRetry(url: string): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(url, {
        headers: {
          Accept: "text/calendar",
          "User-Agent": "Mozilla/5.0 LearnHub-Calendar-Sync",
        },
        signal: ctrl.signal,
        cache: "no-store",
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`Upstream ${res.status}`);
      return await res.text();
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }
  throw lastError ?? new Error("Unbekannter Fehler beim ICS-Abruf");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url") ?? DEFAULT_ICS_URL;

  try {
    const ics = await fetchIcsWithRetry(url);
    const parsed = ical.sync.parseICS(ics);
    const events = mapIcsToCalEvents(parsed as Record<string, never>);
    memoryCache.set(url, { events, fetchedAt: Date.now() });
    return NextResponse.json({ events, cached: false });
  } catch (err) {
    // Fallback auf letzten erfolgreichen Cache, falls vorhanden
    const cached = memoryCache.get(url);
    if (cached) {
      return NextResponse.json({
        events: cached.events,
        cached: true,
        fetchedAt: cached.fetchedAt,
        warning: (err as Error).message,
      });
    }
    return NextResponse.json(
      { error: (err as Error).message, events: [] },
      { status: 502 }
    );
  }
}

