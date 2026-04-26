import { CalendarEvent } from './event'

export interface StudyDay {
  date: string
  minutesPlanned: number
  minutesDone: number
}

export interface StudyPlan {
  event: CalendarEvent
  days: StudyDay[]
  minutesPerDay: number
}
