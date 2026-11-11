import type { ConsultationHistory, ConsultationSession } from '../model/consultation.types'

const CONSULTATION_HISTORY_STORAGE_KEY = 'pingdom-ai-consultation-history-v1'

export function readConsultationHistory(userId: number): ConsultationHistory {
  try {
    const storedHistory = window.localStorage.getItem(
      `${CONSULTATION_HISTORY_STORAGE_KEY}:${userId}`,
    )

    if (!storedHistory) {
      return { activeSessionId: null, sessions: [] }
    }

    const parsedHistory: unknown = JSON.parse(storedHistory)

    if (
      !parsedHistory ||
      typeof parsedHistory !== 'object' ||
      !Array.isArray((parsedHistory as ConsultationHistory).sessions)
    ) {
      return { activeSessionId: null, sessions: [] }
    }

    const sessions = (parsedHistory as ConsultationHistory).sessions.filter(
      (session): session is ConsultationSession =>
        typeof session?.id === 'string' &&
        typeof session.title === 'string' &&
        typeof session.createdAt === 'number' &&
        typeof session.updatedAt === 'number' &&
        (typeof session.submittedPrompt === 'string' ||
          session.submittedPrompt === null),
    )

    return {
      activeSessionId:
        typeof (parsedHistory as ConsultationHistory).activeSessionId === 'string'
          ? (parsedHistory as ConsultationHistory).activeSessionId
          : null,
      sessions,
    }
  } catch {
    return { activeSessionId: null, sessions: [] }
  }
}

export function writeConsultationHistory(history: ConsultationHistory, userId: number) {
  try {
    window.localStorage.setItem(
      `${CONSULTATION_HISTORY_STORAGE_KEY}:${userId}`,
      JSON.stringify(history),
    )
  } catch {
    // 브라우저 저장소를 사용할 수 없는 환경에서는 현재 대화만 유지한다.
  }
}
