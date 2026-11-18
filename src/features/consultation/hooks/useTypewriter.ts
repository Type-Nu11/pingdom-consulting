import { useEffect, useState } from 'react'

export function useTypewriter(
  fullText: string | null,
  initialDelay: number,
  characterDelay: number,
  isInstant = false,
) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const shouldReduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const resetId = window.setTimeout(() => {
      setDisplayedText(
        fullText && (shouldReduceMotion || isInstant) ? fullText : '',
      )
      setIsTyping(Boolean(fullText) && !shouldReduceMotion && !isInstant)
      setIsComplete(Boolean(fullText) && (shouldReduceMotion || isInstant))
    }, 0)

    if (!fullText || shouldReduceMotion || isInstant) {
      return () => window.clearTimeout(resetId)
    }

    const characters = Array.from(fullText)
    let characterIndex = 0
    let intervalId: number | undefined

    const delayId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        characterIndex += 1
        setDisplayedText(characters.slice(0, characterIndex).join(''))

        if (characterIndex >= characters.length) {
          window.clearInterval(intervalId)
          setIsTyping(false)
          setIsComplete(true)
        }
      }, characterDelay)
    }, initialDelay)

    return () => {
      window.clearTimeout(resetId)
      window.clearTimeout(delayId)
      window.clearInterval(intervalId)
    }
  }, [characterDelay, fullText, initialDelay, isInstant])

  return { displayedText, isComplete, isTyping }
}
