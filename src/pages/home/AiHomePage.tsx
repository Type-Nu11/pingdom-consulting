import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import {
  CONSULTATION_PROMPT_MAX_LENGTH,
  requestConsultationIntro,
} from '../../features/consultation/consultationAiApi'
import type { LocationSelection } from '../../features/location/location.types'
import ConsultationSummaryPanel from './ConsultationSummaryPanel'
import LocationSelectionPanel from './LocationSelectionPanel'
import * as S from './AiHomePage.styles'

const STORE_CATEGORIES = [
  { code: 'RESTAURANT', label: '음식점' },
  { code: 'MUSIC', label: '음악' },
  { code: 'POP_UP', label: '팝업' },
  { code: 'FASHION', label: '패션' },
  { code: 'BEAUTY', label: '뷰티' },
  { code: 'EXHIBITION', label: '전시' },
  { code: 'CAFE', label: '카페' },
  { code: 'CULTURAL_HERITAGE', label: '문화재' },
  { code: 'OTHER', label: '기타' },
] as const

const STORE_CATEGORY_LABELS = STORE_CATEGORIES.map(({ label }) => label)

const CATEGORY_ASSISTANT_FALLBACK =
  '말씀해주신 가게를 준비하고 계시는군요. 정확한 분석을 위해 아래 카테고리 중 가장 가까운 업종을 선택해 주세요.'

const CATEGORY_TEXT_SEQUENCE = [
  '가게 카테고리',
  '1단계',
  '어떤 가게에 가장 가까운가요?',
  '아래 카테고리 중 하나를 선택해 주세요.',
  ...STORE_CATEGORIES.map(({ label }) => label),
  '선택하기',
] as const

const CATEGORY_CONFIRM_INDEX = 4 + STORE_CATEGORIES.length

type StoreCategoryCode = (typeof STORE_CATEGORIES)[number]['code']

function useTypewriter(
  fullText: string | null,
  initialDelay: number,
  characterDelay: number,
) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const shouldReduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const resetId = window.setTimeout(() => {
      setDisplayedText(fullText && shouldReduceMotion ? fullText : '')
      setIsTyping(Boolean(fullText) && !shouldReduceMotion)
      setIsComplete(Boolean(fullText) && shouldReduceMotion)
    }, 0)

    if (!fullText || shouldReduceMotion) {
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
  }, [characterDelay, fullText, initialDelay])

  return { displayedText, isComplete, isTyping }
}

function useCategorySequence(isActive: boolean) {
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
        isActive && shouldReduceMotion
          ? [...CATEGORY_TEXT_SEQUENCE]
          : CATEGORY_TEXT_SEQUENCE.map(() => ''),
      )
      setIsComplete(isActive && shouldReduceMotion)
      setActiveItemIndex(isActive && !shouldReduceMotion ? 0 : -1)
    }, 0)

    if (!isActive || shouldReduceMotion) {
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
  }, [isActive])

  return { activeItemIndex, displayedItems, isComplete }
}

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m4 17 4.5-4 3.5 3 2.5-2 5.5 5" />
    </svg>
  )
}

function AiHomePage() {
  const [prompt, setPrompt] = useState('')
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null)
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(null)
  const [assistantMessage, setAssistantMessage] = useState<string | null>(null)
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false)
  const [isPromptExpanded, setIsPromptExpanded] = useState(false)
  const [selectedCategory, setSelectedCategory] =
    useState<StoreCategoryCode | null>(null)
  const [confirmedCategory, setConfirmedCategory] =
    useState<StoreCategoryCode | null>(null)
  const [customCategory, setCustomCategory] = useState('')
  const [confirmedCustomCategory, setConfirmedCustomCategory] = useState('')
  const [confirmedLocation, setConfirmedLocation] =
    useState<LocationSelection | null>(null)
  const [additionalDetails, setAdditionalDetails] = useState('')
  const [confirmedAdditionalDetails, setConfirmedAdditionalDetails] =
    useState('')
  const [isSummaryConfirmed, setIsSummaryConfirmed] = useState(false)
  const promptInputRef = useRef<HTMLTextAreaElement>(null)
  const promptHeightRef = useRef(44)
  const promptLengthRef = useRef(0)
  const conversationMessagesRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const introRequestRef = useRef<AbortController | null>(null)

  const confirmedCategoryLabel =
    confirmedCategory === 'OTHER'
      ? confirmedCustomCategory
      : STORE_CATEGORIES.find(({ code }) => code === confirmedCategory)?.label
  const isSelectionConfirmed =
    selectedCategory !== null && confirmedCategory === selectedCategory
  const canConfirmCategory =
    selectedCategory !== null &&
    (selectedCategory !== 'OTHER' || customCategory.trim().length > 0)
  const isCollectingCategory = submittedPrompt !== null
  const isTransitioningToConversation =
    pendingPrompt !== null && submittedPrompt === null
  const followupMessage = confirmedCategoryLabel
    ? '좋아요. 선택한 업종에 맞는 입지를 찾기 위해 희망 지역을 알려주세요.'
    : null
  const locationConfirmationMessage =
    confirmedCategoryLabel && confirmedLocation
      ? '좋아요. 지금까지 알려주신 정보가 맞는지 마지막으로 확인해 주세요.'
      : null
  const consultationReadyMessage =
    confirmedCategoryLabel && confirmedLocation && isSummaryConfirmed
      ? `${confirmedCategoryLabel} 업종과 ${confirmedLocation.displayName} 정보를 확인했어요.${confirmedAdditionalDetails ? ' 기타 요청사항도 함께 반영해' : ''} 상권 분석을 준비할게요.`
      : null
  const initialTypewriter = useTypewriter(assistantMessage, 520, 24)
  const followupTypewriter = useTypewriter(followupMessage, 360, 28)
  const locationConfirmationTypewriter = useTypewriter(
    locationConfirmationMessage,
    360,
    28,
  )
  const consultationReadyTypewriter = useTypewriter(
    consultationReadyMessage,
    320,
    26,
  )
  const categorySequence = useCategorySequence(initialTypewriter.isComplete)

  useEffect(() => {
    if (!pendingPrompt) {
      return
    }

    const transitionId = window.setTimeout(() => {
      setSubmittedPrompt(pendingPrompt)
      setPendingPrompt(null)
    }, 720)

    return () => window.clearTimeout(transitionId)
  }, [pendingPrompt])

  useEffect(() => {
    if (!submittedPrompt) {
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
  }, [submittedPrompt])

  useLayoutEffect(() => {
    const input = promptInputRef.current

    if (!input) {
      return
    }

    const currentHeight = input.getBoundingClientRect().height
    const isPromptShorter = prompt.length < promptLengthRef.current
    promptLengthRef.current = prompt.length

    let contentHeight = input.scrollHeight

    if (isPromptShorter) {
      input.style.height = 'auto'
      contentHeight = input.scrollHeight
      input.style.height = `${currentHeight}px`
    }

    const nextHeight = Math.min(contentHeight, 140)
    input.style.overflowY = contentHeight > 140 ? 'auto' : 'hidden'

    if (nextHeight === promptHeightRef.current) {
      return
    }

    promptHeightRef.current = nextHeight
    input.style.height = `${currentHeight}px`

    const animationFrame = requestAnimationFrame(() => {
      input.style.height = `${nextHeight}px`
    })

    return () => cancelAnimationFrame(animationFrame)
  }, [prompt])

  useLayoutEffect(() => {
    if (!confirmedCategory) {
      return
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    })
  }, [
    confirmedCategory,
    confirmedLocation,
    followupTypewriter.isComplete,
    locationConfirmationTypewriter.isComplete,
    isSummaryConfirmed,
  ])

  function resetConsulting() {
    introRequestRef.current?.abort()
    setPrompt('')
    setPendingPrompt(null)
    setSubmittedPrompt(null)
    setAssistantMessage(null)
    setSelectedCategory(null)
    setConfirmedCategory(null)
    setCustomCategory('')
    setConfirmedCustomCategory('')
    setConfirmedLocation(null)
    setAdditionalDetails('')
    setConfirmedAdditionalDetails('')
    setIsSummaryConfirmed(false)
    setIsAttachmentMenuOpen(false)
    setIsPromptExpanded(false)
  }

  function handleConversationGutterWheel(
    event: ReactWheelEvent<HTMLElement>,
  ) {
    if (event.target !== event.currentTarget) {
      return
    }

    const messages = conversationMessagesRef.current

    if (!messages) {
      return
    }

    messages.scrollTop += event.deltaY
  }

  function handlePromptSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedPrompt = prompt.trim()

    if (!trimmedPrompt || isCollectingCategory || isTransitioningToConversation) {
      return
    }

    setPendingPrompt(trimmedPrompt)
    setPrompt('')
    setIsAttachmentMenuOpen(false)
    setIsPromptExpanded(false)
  }

  function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canConfirmCategory || !selectedCategory) {
      return
    }

    setConfirmedCustomCategory(
      selectedCategory === 'OTHER' ? customCategory.trim() : '',
    )
    setConfirmedCategory(selectedCategory)
  }

  function handleLocationConfirm(location: LocationSelection) {
    setConfirmedLocation(location)
    setConfirmedAdditionalDetails('')
    setIsSummaryConfirmed(false)
  }

  function handleSummaryCategoryChange(categoryLabel: string) {
    const matchingCategory = STORE_CATEGORIES.find(
      ({ label }) => label === categoryLabel,
    )
    const nextCategory = matchingCategory?.code ?? 'OTHER'
    const nextCustomCategory = matchingCategory ? '' : categoryLabel

    setSelectedCategory(nextCategory)
    setConfirmedCategory(nextCategory)
    setCustomCategory(nextCustomCategory)
    setConfirmedCustomCategory(nextCustomCategory)
  }

  function handleSummaryLocationChange(location: LocationSelection) {
    setConfirmedLocation(location)
  }

  function handleSummaryConfirm() {
    setConfirmedAdditionalDetails(additionalDetails.trim())
    setIsSummaryConfirmed(true)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  function handlePromptChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const input = event.currentTarget
    const nextPrompt = input.value

    setPrompt(nextPrompt)
    setIsPromptExpanded(
      nextPrompt.length > 0 && (isPromptExpanded || input.scrollHeight > 44),
    )
  }

  function handleCategorySelect(category: StoreCategoryCode) {
    if (isSelectionConfirmed) {
      return
    }

    setSelectedCategory(category)
  }

  function renderComposer(
    isLocked: boolean,
    lockedPlaceholder?: string,
    isTransitioning = false,
  ) {
    return (
      <S.ComposerArea
        data-conversation={isLocked && !isTransitioning}
        data-transitioning={isTransitioning}
      >
        <S.Form
          onSubmit={handlePromptSubmit}
          data-expanded={isPromptExpanded}
        >
          <S.InputActionWrapper
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setIsAttachmentMenuOpen(false)
              }
            }}
          >
            <S.InputAction
              type="button"
              aria-label="추가 기능"
              aria-haspopup="menu"
              aria-expanded={isAttachmentMenuOpen}
              disabled={isLocked}
              onClick={() => setIsAttachmentMenuOpen((isOpen) => !isOpen)}
            >
              <PlusIcon />
            </S.InputAction>

            {isAttachmentMenuOpen ? (
              <S.AttachmentMenu role="menu" aria-label="추가할 항목 선택">
                <S.AttachmentMenuItem
                  type="button"
                  role="menuitem"
                  onClick={() => setIsAttachmentMenuOpen(false)}
                >
                  <S.MenuItemIcon>
                    <FileIcon />
                  </S.MenuItemIcon>
                  <S.MenuItemText>
                    <strong>파일 첨부</strong>
                    <span>PDF, 문서, 표</span>
                  </S.MenuItemText>
                </S.AttachmentMenuItem>
                <S.AttachmentMenuItem
                  type="button"
                  role="menuitem"
                  onClick={() => setIsAttachmentMenuOpen(false)}
                >
                  <S.MenuItemIcon>
                    <ImageIcon />
                  </S.MenuItemIcon>
                  <S.MenuItemText>
                    <strong>사진 첨부</strong>
                    <span>매장 및 상권 이미지</span>
                  </S.MenuItemText>
                </S.AttachmentMenuItem>
              </S.AttachmentMenu>
            ) : null}
          </S.InputActionWrapper>

          <S.PromptInput
            ref={promptInputRef}
            rows={1}
            value={prompt}
            disabled={isLocked}
            onChange={handlePromptChange}
            onKeyDown={handleKeyDown}
            placeholder={
              isLocked
                ? lockedPlaceholder ?? '먼저 가게 카테고리를 선택해 주세요'
                : '궁금한 상권이나 입지를 물어보세요'
            }
            maxLength={CONSULTATION_PROMPT_MAX_LENGTH}
            aria-label="AI 질문 입력"
          />
          <S.SubmitButton
            type="submit"
            disabled={isLocked || !prompt.trim()}
            aria-label="질문 보내기"
          >
            <ArrowUpIcon />
          </S.SubmitButton>
        </S.Form>
        <S.ComposerHint>
          {isLocked
            ? !categorySequence.isComplete
              ? 'AI가 답변과 선택지를 작성하고 있습니다.'
              : !confirmedCategory
                ? '카테고리를 선택하면 다음 상담 단계로 이어집니다.'
                : !confirmedLocation
                  ? '희망 장소를 선택하면 입력 정보를 확인할 수 있습니다.'
                  : !isSummaryConfirmed
                    ? '입력한 정보를 확인하면 상권 분석을 준비합니다.'
                    : '확인한 조건으로 상권 분석을 준비하고 있습니다.'
            : '핑덤의 유동인구 데이터와 AI 분석을 바탕으로 답변합니다.'}
        </S.ComposerHint>
      </S.ComposerArea>
    )
  }

  return (
    <S.PageShell>
      <S.Sidebar>
        <S.SidebarHeader>
          <S.BrandLogo src="/pingdom-logo.png" alt="Pingdom" />
        </S.SidebarHeader>

        <S.NewChatButton type="button" onClick={resetConsulting}>
          <PlusIcon />
          새 상담
        </S.NewChatButton>

        <S.SidebarContent>
          <S.SidebarLabel>상담</S.SidebarLabel>
          <S.EmptyHistory>아직 저장된 상담이 없습니다.</S.EmptyHistory>
        </S.SidebarContent>
      </S.Sidebar>

      <S.Workspace>
        <S.TopBar>
          <S.MobileBrandLogo src="/pingdom-logo.png" alt="Pingdom" />
        </S.TopBar>

        <S.ChatMain
          data-conversation={isCollectingCategory}
          data-transitioning={isTransitioningToConversation}
        >
          {submittedPrompt ? (
            <S.ConversationLayout
              aria-live="polite"
              onWheel={handleConversationGutterWheel}
            >
              <S.ConversationMessages ref={conversationMessagesRef}>
                <S.UserMessageRow>
                  <S.UserMessageBubble>{submittedPrompt}</S.UserMessageBubble>
                </S.UserMessageRow>

                <S.AssistantMessageRow>
                  <S.AssistantAvatar aria-hidden="true">
                    <img src="/pingdom-favicon.png" alt="" />
                  </S.AssistantAvatar>
                  <S.AssistantMessageContent
                    data-streaming={
                      initialTypewriter.isTyping ||
                      (initialTypewriter.isComplete &&
                        !categorySequence.isComplete)
                    }
                  >
                    <S.AssistantIntro>
                      {initialTypewriter.displayedText ? (
                        <>
                          {initialTypewriter.displayedText}
                          {initialTypewriter.isTyping ? (
                            <S.TypingCursor aria-hidden="true" />
                          ) : null}
                        </>
                      ) : (
                        <S.TypingIndicator aria-label="AI가 답변을 작성하고 있습니다">
                          <span />
                          <span />
                          <span />
                        </S.TypingIndicator>
                      )}
                    </S.AssistantIntro>

                    {initialTypewriter.isComplete ? (
                    <S.CategoryPanel
                      data-animated="true"
                      data-streaming={!categorySequence.isComplete}
                    >
                      <S.CategoryPanelHeader>
                        <S.CategoryPanelTitle>
                          <span>{categorySequence.displayedItems[0]}</span>
                          {categorySequence.activeItemIndex === 0 ? (
                            <S.TypingCursor aria-hidden="true" />
                          ) : null}
                        </S.CategoryPanelTitle>
                        <S.StepBadge>
                          {categorySequence.displayedItems[1]}
                          {categorySequence.activeItemIndex === 1 ? (
                            <S.TypingCursor aria-hidden="true" />
                          ) : null}
                        </S.StepBadge>
                      </S.CategoryPanelHeader>

                      <S.CategoryForm onSubmit={handleCategorySubmit}>
                        <S.CategoryFieldset
                          disabled={
                            isSelectionConfirmed || !categorySequence.isComplete
                          }
                        >
                          <S.CategoryQuestion>
                            {categorySequence.displayedItems[2]}
                            {categorySequence.activeItemIndex === 2 ? (
                              <S.TypingCursor aria-hidden="true" />
                            ) : null}
                          </S.CategoryQuestion>
                          <S.CategoryHelp>
                            {categorySequence.displayedItems[3]}
                            {categorySequence.activeItemIndex === 3 ? (
                              <S.TypingCursor aria-hidden="true" />
                            ) : null}
                          </S.CategoryHelp>

                          <S.CategoryList>
                            {STORE_CATEGORIES.map(({ code }, categoryIndex) => {
                              const isSelected = selectedCategory === code
                              const displayedLabel =
                                categorySequence.displayedItems[categoryIndex + 4]

                              if (!displayedLabel) {
                                return null
                              }

                              return (
                                <S.CategoryOption
                                  key={code}
                                  type="button"
                                  aria-pressed={isSelected}
                                  data-selected={isSelected}
                                  onClick={() => handleCategorySelect(code)}
                                >
                                  <S.SelectionIndicator aria-hidden="true">
                                    {isSelected ? '✓' : ''}
                                  </S.SelectionIndicator>
                                  <S.CategoryTypingText>
                                    <span>{displayedLabel}</span>
                                    {categorySequence.activeItemIndex ===
                                    categoryIndex + 4 ? (
                                      <S.TypingCursor aria-hidden="true" />
                                    ) : null}
                                  </S.CategoryTypingText>
                                </S.CategoryOption>
                              )
                            })}
                          </S.CategoryList>

                          {selectedCategory === 'OTHER' ? (
                            <S.CustomCategoryField>
                              <S.CustomCategoryLabel htmlFor="custom-category">
                                어떤 가게인지 직접 입력해 주세요
                              </S.CustomCategoryLabel>
                              <S.CustomCategoryInput
                                id="custom-category"
                                value={customCategory}
                                onChange={(event) =>
                                  setCustomCategory(event.currentTarget.value)
                                }
                                placeholder="예: 반려동물 용품점"
                                maxLength={40}
                                autoFocus
                              />
                            </S.CustomCategoryField>
                          ) : null}
                        </S.CategoryFieldset>

                        <S.CategoryConfirmButton
                          type="submit"
                          disabled={!canConfirmCategory || isSelectionConfirmed}
                        >
                          {isSelectionConfirmed
                            ? '선택 완료'
                            : categorySequence.displayedItems[
                                CATEGORY_CONFIRM_INDEX
                              ]}
                          {!isSelectionConfirmed &&
                          categorySequence.activeItemIndex ===
                            CATEGORY_CONFIRM_INDEX ? (
                            <S.TypingCursor aria-hidden="true" />
                          ) : null}
                        </S.CategoryConfirmButton>
                      </S.CategoryForm>
                    </S.CategoryPanel>
                    ) : null}
                  </S.AssistantMessageContent>
                </S.AssistantMessageRow>

                {confirmedCategory && confirmedCategoryLabel ? (
                  <>
                    <S.UserMessageRow>
                      <S.UserMessageBubble>
                        {confirmedCategoryLabel}
                      </S.UserMessageBubble>
                    </S.UserMessageRow>
                    <S.AssistantMessageRow>
                      <S.AssistantAvatar aria-hidden="true">
                        <img src="/pingdom-favicon.png" alt="" />
                      </S.AssistantAvatar>
                      <S.AssistantMessageContent>
                        <S.AssistantFollowup
                          role="status"
                          aria-busy={followupTypewriter.isTyping}
                        >
                          {followupTypewriter.displayedText ? (
                            <>
                              {followupTypewriter.displayedText}
                              {followupTypewriter.isTyping ? (
                                <S.TypingCursor aria-hidden="true" />
                              ) : null}
                            </>
                          ) : (
                            <S.TypingIndicator aria-label="AI가 답변을 작성하고 있습니다">
                              <span />
                              <span />
                              <span />
                            </S.TypingIndicator>
                          )}
                        </S.AssistantFollowup>

                        {followupTypewriter.isComplete ? (
                          <LocationSelectionPanel
                            confirmedLocation={confirmedLocation}
                            onConfirm={handleLocationConfirm}
                          />
                        ) : null}
                      </S.AssistantMessageContent>
                    </S.AssistantMessageRow>
                  </>
                ) : null}

                {confirmedLocation && confirmedCategoryLabel ? (
                  <>
                    <S.UserMessageRow>
                      <S.UserMessageBubble>
                        {confirmedLocation.displayName}
                      </S.UserMessageBubble>
                    </S.UserMessageRow>
                    <S.AssistantMessageRow>
                      <S.AssistantAvatar aria-hidden="true">
                        <img src="/pingdom-favicon.png" alt="" />
                      </S.AssistantAvatar>
                      <S.AssistantMessageContent>
                        <S.AssistantFollowup
                          role="status"
                          aria-busy={locationConfirmationTypewriter.isTyping}
                        >
                          {locationConfirmationTypewriter.displayedText ? (
                            <>
                              {locationConfirmationTypewriter.displayedText}
                              {locationConfirmationTypewriter.isTyping ? (
                                <S.TypingCursor aria-hidden="true" />
                              ) : null}
                            </>
                          ) : (
                            <S.TypingIndicator aria-label="AI가 답변을 작성하고 있습니다">
                              <span />
                              <span />
                              <span />
                            </S.TypingIndicator>
                          )}
                        </S.AssistantFollowup>

                        {locationConfirmationTypewriter.isComplete ? (
                          <ConsultationSummaryPanel
                            categoryLabel={confirmedCategoryLabel}
                            location={confirmedLocation}
                            categoryOptions={STORE_CATEGORY_LABELS}
                            additionalDetails={additionalDetails}
                            isConfirmed={isSummaryConfirmed}
                            onAdditionalDetailsChange={setAdditionalDetails}
                            onCategoryChange={handleSummaryCategoryChange}
                            onLocationChange={handleSummaryLocationChange}
                            onConfirm={handleSummaryConfirm}
                          />
                        ) : null}
                      </S.AssistantMessageContent>
                    </S.AssistantMessageRow>
                  </>
                ) : null}

                {isSummaryConfirmed ? (
                  <>
                    <S.UserMessageRow>
                      <S.UserMessageBubble>
                        입력한 정보가 맞아요.
                        {confirmedAdditionalDetails
                          ? `\n기타 요청사항: ${confirmedAdditionalDetails}`
                          : ''}
                      </S.UserMessageBubble>
                    </S.UserMessageRow>
                    <S.AssistantMessageRow>
                      <S.AssistantAvatar aria-hidden="true">
                        <img src="/pingdom-favicon.png" alt="" />
                      </S.AssistantAvatar>
                      <S.AssistantFollowup
                        role="status"
                        aria-busy={consultationReadyTypewriter.isTyping}
                      >
                        {consultationReadyTypewriter.displayedText}
                        {consultationReadyTypewriter.isTyping ? (
                          <S.TypingCursor aria-hidden="true" />
                        ) : null}
                      </S.AssistantFollowup>
                    </S.AssistantMessageRow>
                  </>
                ) : null}

                <S.ConversationEnd ref={messagesEndRef} />
              </S.ConversationMessages>

              <S.ConversationComposer>
                {renderComposer(
                  true,
                  !categorySequence.isComplete
                    ? 'AI가 답변과 선택지를 작성하고 있어요'
                    : !confirmedCategory
                      ? '먼저 가게 카테고리를 선택해 주세요'
                      : !followupTypewriter.isComplete
                        ? 'AI가 다음 질문을 작성하고 있어요'
                        : !confirmedLocation
                          ? '희망 장소를 선택해 주세요'
                          : !locationConfirmationTypewriter.isComplete
                            ? 'AI가 입력 정보를 정리하고 있어요'
                            : !isSummaryConfirmed
                              ? '입력한 정보를 확인해 주세요'
                              : '상권 분석을 준비하고 있어요',
                )}
              </S.ConversationComposer>
            </S.ConversationLayout>
          ) : (
            <S.EmptyState
              aria-live="polite"
              data-leaving={isTransitioningToConversation}
            >
              <S.MessageTitle>어떤 가게를 준비하고 계신가요?</S.MessageTitle>
              <S.MessageText>
                준비하고 있는 가게를 편하게 말씀해 주세요. 필요한 조건은
                대화를 통해 하나씩 여쭤볼게요.
              </S.MessageText>
              {renderComposer(
                isTransitioningToConversation,
                '상담 대화로 이동하고 있어요',
                isTransitioningToConversation,
              )}
            </S.EmptyState>
          )}
        </S.ChatMain>
      </S.Workspace>
    </S.PageShell>
  )
}

export default AiHomePage
