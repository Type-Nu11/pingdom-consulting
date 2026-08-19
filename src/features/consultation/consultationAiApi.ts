import axios from 'axios'

export const CONSULTATION_PROMPT_MAX_LENGTH = 300

type ConsultationIntroResponse = {
  message: string
  source: 'gemini' | 'fallback'
}

export async function requestConsultationIntro(
  message: string,
  signal: AbortSignal,
) {
  const response = await axios.post<ConsultationIntroResponse>(
    '/api/consultations/intro',
    { message },
    {
      signal,
      timeout: 6_500,
    },
  )
  const generatedMessage = response.data.message?.trim()

  if (!generatedMessage) {
    throw new Error('AI 상담 안내문이 비어 있습니다.')
  }

  return generatedMessage
}
