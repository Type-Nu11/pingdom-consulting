import { useEffect, useState } from 'react'
import { STORE_CATEGORIES } from '../model/consultationOptions'

const CATEGORY_TEXT_SEQUENCE = [
  '가게 카테고리',
  '1단계',
  '어떤 가게에 가장 가까운가요?',
  '아래 카테고리 중 하나를 선택해 주세요.',
  ...STORE_CATEGORIES.map(({ label }) => label),
  '선택하기',
] as const

export function useCategorySequence(isActive: boolean, isInstant = false) {
  const [displayedItems, setDisplayedItems] = useState<string[]>(() =>
    CATEGORY_TEXT_SEQUENCE.map(() => ''),
  )
  const [isComplete, setIsComplete] = useState(false)
  const [activeItemIndex, setActiveItemIndex] = useState(-1)

  useEffect(() => {
    const shouldReduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const resetId = window.setTimeout(() => {
      setDisplayedItems(
        isActive && (shouldReduceMotion || isInstant)
          ? [...CATEGORY_TEXT_SEQUENCE]
          : CATEGORY_TEXT_SEQUENCE.map(() => ''),
      )
      setIsComplete(isActive && (shouldReduceMotion || isInstant))
      setActiveItemIndex(isActive && !shouldReduceMotion && !isInstant ? 0 : -1)
    }, 0)

    if (!isActive || shouldReduceMotion || isInstant) {
      return () => window.clearTimeout(resetId)
    }

    let itemIndex = 0
    let characterIndex = 0
    let gapTicks = 0
    let intervalId: number | undefined

    const delayId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        if (gapTicks > 0) {
          gapTicks -= 1
          return
        }

        const characters = Array.from(CATEGORY_TEXT_SEQUENCE[itemIndex])
        characterIndex += 1
        const currentItemIndex = itemIndex
        const activeItemText = characters.slice(0, characterIndex).join('')
        setActiveItemIndex(currentItemIndex)
        setDisplayedItems((currentItems) => {
          const nextItems = [...currentItems]
          nextItems[currentItemIndex] = activeItemText
          return nextItems
        })

        if (characterIndex >= characters.length) {
          itemIndex += 1
          characterIndex = 0
          gapTicks = 2

          if (itemIndex >= CATEGORY_TEXT_SEQUENCE.length) {
            window.clearInterval(intervalId)
            setIsComplete(true)
            setActiveItemIndex(-1)
          }
        }
      }, 38)
    }, 220)

    return () => {
      window.clearTimeout(resetId)
      window.clearTimeout(delayId)
      window.clearInterval(intervalId)
    }
  }, [isActive, isInstant])

  return { activeItemIndex, displayedItems, isComplete }
}
