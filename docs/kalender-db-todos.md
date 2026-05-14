# Offene Aufgaben: Kalender-Integration (DB-abhängig)

Diese Aufgaben können erst umgesetzt werden, sobald das Datenbank-Schema für LearnHub festgelegt wurde.

---

## 1. Prisma-Modell: `CalendarSource`

**Datei:** `prisma/schema.prisma`

Neues Modell hinzufügen, das externe Kalender-Quellen pro User speichert:

```prisma
model CalendarSource {
  id           String   @id @default(cuid())
  userId       String
  name         String
  url          String
  type         String   @default("ics") // "ics" | "google" | ...
  lastSyncedAt DateTime?
  createdAt    DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

Danach ausführen:
```bash
npm run prisma:migrate
npm run prisma:generate
```

---

## 2. API-Route anpassen: `src/app/api/calendar/external/route.ts`

Aktuell ist die DHBW-URL **hardcoded** als `DEFAULT_ICS_URL`.

Nach der DB-Einrichtung:
- Den eingeloggten User aus der Session lesen
- Seine `CalendarSource`-Einträge aus der DB laden (Prisma)
- Alle konfigurierten Quellen fetchen & mergen (statt nur der Default-URL)
- `?url=...`-Override optional behalten (für Tests)

```ts
// Beispiel-Pseudocode für die Route
const sources = await prisma.calendarSource.findMany({
  where: { userId: session.user.id },
});
const allEvents = await Promise.all(sources.map(s => fetchAndParse(s.url)));
```

---

## 3. Settings-UI: Kalender-Quellen verwalten

**Neue Datei:** `src/components/settings/CalendarSourcesSettings.tsx`  
**Einbinden in:** bestehende Settings-Page (`src/app/settings/page.tsx`)

Funktionen:
- Liste der gespeicherten Kalender-Quellen anzeigen
- Neue Quelle hinzufügen (Name + ICS-URL)
- Bestehende Quelle löschen
- Ggf. manueller „Jetzt synchronisieren"-Button pro Quelle

Benötigte API-Endpunkte (noch anzulegen):
- `GET  /api/calendar/sources` — Liste für aktuellen User
- `POST /api/calendar/sources` — Neue Quelle speichern
- `DELETE /api/calendar/sources/[id]` — Quelle löschen
