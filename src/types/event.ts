export type EventType = 'exam' | 'deadline'

export interface CalendarEvent {
  id: string
  title: string
  subject: string
  type: EventType
  date: string           // ISO: YYYY-MM-DD
  studyStartDate?: string
  notes?: string
}
