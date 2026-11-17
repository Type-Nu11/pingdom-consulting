import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
import { requestConsultationIntro } from '../consultationAiApi'

const CATEGORY_ASSISTANT_FALLBACK =
  '말씀해주신 가게를 준비하고 계시는군요. 정확한 분석을 위해 아래 카테고리 중 가장 가까운 업종을 선택해 주세요.'

type ConsultationIntroOptions = {
  submittedPrompt: string | null
  assistantMessage: string | null
  setAssistantMessage: Dispatch<SetStateAction<string | null>>
}

// The message remains part of the page's persisted session draft. This hook
// owns only the request lifetime; pass the page's stable useState setter.
export function useConsultationIntro({
  submittedPrompt,
  assistantMessage,
  setAssistantMessage,
}: ConsultationIntroOptions) {
  const introRequestRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!submittedPrompt || assistantMessage) {
      return
    }

    const promptToSend = submittedPrompt
    const controller = new AbortController()
    introRequestRef.current = controller

    async function loadAssistantMessage() {
      try {
        const generatedMessage = await requestConsultationIntro(
          promptToSend,
          controller.signal,
        )

        if (!controller.signal.aborted) {
          setAssistantMessage(generatedMessage)
        }
      } catch {
        if (!controller.signal.aborted) {
          setAssistantMessage(CATEGORY_ASSISTANT_FALLBACK)
        }
      }
    }

    void loadAssistantMessage()

    return () => {
      controller.abort()
      if (introRequestRef.current === controller) {
        introRequestRef.current = null
      }
    }
  }, [assistantMessage, submittedPrompt, setAssistantMessage])

  function cancelIntro() {
    introRequestRef.current?.abort()
  }

  return { cancelIntro }
}
