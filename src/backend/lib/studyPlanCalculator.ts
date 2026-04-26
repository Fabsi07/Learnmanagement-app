import { CalendarEvent } from '@/types/event'
import { StudyPlan, StudyDay } from '@/types/studyPlan'

/**
 * Berechnet wie viele Minuten pro Tag gelernt werden müssen.
 * @param event      Die Klausur / Abgabe
 * @param totalMinutes Geschätzter Gesamtaufwand in Minuten
 */
export function calculateStudyPlan(
  event: CalendarEvent,
  totalMinutes: number
): StudyPlan | null {
  if (!event.studyStartDate) return null

  const start = new Date(event.studyStartDate)
  const end = new Date(event.date)
  const days: StudyDay[] = []

  const current = new Date(start)
  while (current < end) {
    days.push({
      date: current.toISOString().split('T')[0],
      minutesPlanned: 0, // wird nach Berechnung befüllt
      minutesDone: 0,
    })
    current.setDate(current.getDate() + 1)
  }

  if (days.length === 0) return null

  const minutesPerDay = Math.ceil(totalMinutes / days.length)
  days.forEach(d => (d.minutesPlanned = minutesPerDay))

  return { event, days, minutesPerDay }
}
