import { apiClient } from '../api/apiClient'

export const CONSULTATION_PROMPT_MAX_LENGTH = 300

type ConsultationIntroResponse = {
  message: string
  source: 'gemini' | 'fallback'
}

export async function requestConsultationIntro(
  message: string,
  signal: AbortSignal,
) {
  const response = await apiClient.post<ConsultationIntroResponse>(
    '/consultations/intro',
    { message },
    {
      signal,
    },
  )
  const generatedMessage = response.data.message?.trim()

  if (!generatedMessage) {
    throw new Error('AI 상담 안내문이 비어 있습니다.')
  }

  return generatedMessage
}
