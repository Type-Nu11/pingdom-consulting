import { useEffect, type Dispatch, type SetStateAction } from 'react'

const CONVERSATION_TRANSITION_DELAY = 480

// The page owns both prompt values because they are part of the saved consultation.
export function useConversationTransition(
  pendingPrompt: string | null,
  setSubmittedPrompt: Dispatch<SetStateAction<string | null>>,
  setPendingPrompt: Dispatch<SetStateAction<string | null>>,
) {
  useEffect(() => {
    if (!pendingPrompt) {
      return
    }

    let handoffId: number | undefined
    const transitionId = window.setTimeout(() => {
      setSubmittedPrompt(pendingPrompt)
      handoffId = window.setTimeout(() => {
        setPendingPrompt((currentPrompt) =>
          currentPrompt === pendingPrompt ? null : currentPrompt,
        )
      }, 220)
    }, CONVERSATION_TRANSITION_DELAY)

    return () => {
      window.clearTimeout(transitionId)
      window.clearTimeout(handoffId)
    }
  }, [pendingPrompt, setSubmittedPrompt, setPendingPrompt])
}
