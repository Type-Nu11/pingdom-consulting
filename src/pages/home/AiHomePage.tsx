import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react'
import {
  CONSULTATION_PROMPT_MAX_LENGTH,
  requestConsultationIntro,
} from '../../features/consultation/consultationAiApi'
import { requestLocationAnalysisReport } from '../../features/analysis/locationAnalysisReportApi'
import type { LocationSelection } from '../../features/location/location.types'
import ConsultationSummaryPanel from './ConsultationSummaryPanel'
import LocationSelectionPanel from './LocationSelectionPanel'
import OperatingHoursPanel from './OperatingHoursPanel'
import type { OperatingHours } from './operatingHours.types'
import TargetCustomerPanel from './TargetCustomerPanel'
import type { TargetCustomerSelection } from './targetCustomerOptions'
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
const ASSISTANT_RESPONSE_LOADING_DELAY = 1500
const CONSULTATION_HISTORY_STORAGE_KEY = 'pingdom-ai-consultation-history-v1'
const SESSION_TITLE_PREVIEW_LENGTH = 11
const STARTER_PROMPTS = [
  '수원역 근처에 브런치 카페를 열고 싶어요.',
  '직장인이 많이 찾는 점심 식당 입지를 추천해 주세요.',
  '20대가 많이 찾는 팝업스토어 위치를 찾고 싶어요.',
] as const

type StoreCategoryCode = (typeof STORE_CATEGORIES)[number]['code']

type ConsultationSession = {
  id: string
  title: string
  isPinned: boolean
  createdAt: number
  updatedAt: number
  pendingPrompt: string | null
  submittedPrompt: string | null
  assistantMessage: string | null
  selectedCategory: StoreCategoryCode | null
  confirmedCategory: StoreCategoryCode | null
  customCategory: string
  confirmedCustomCategory: string
  confirmedLocation: LocationSelection | null
  confirmedTargetCustomer: TargetCustomerSelection | null
  confirmedOperatingHours: OperatingHours | null
  additionalDetails: string
  confirmedAdditionalDetails: string
  isSummaryConfirmed: boolean
}

type ConsultationHistory = {
  activeSessionId: string | null
  sessions: ConsultationSession[]
}

function createSessionId() {
  return crypto.randomUUID()
}

function createSessionTitle(prompt: string) {
  const normalizedPrompt = prompt.replace(/\s+/g, ' ').trim()

  return normalizedPrompt
}

function formatSessionPreview(title: string) {
  const characters = Array.from(title)

  return characters.length > SESSION_TITLE_PREVIEW_LENGTH
    ? `${characters.slice(0, SESSION_TITLE_PREVIEW_LENGTH).join('')}...`
    : title
}

function formatTargetCustomerGroup(customer: TargetCustomerSelection) {
  const ages = customer.ageGroups
    .map((ageGroup) => Number.parseInt(ageGroup, 10))
    .sort((left, right) => left - right)
  const ageRanges: string[] = []

  for (let startIndex = 0; startIndex < ages.length; ) {
    let endIndex = startIndex

    while (ages[endIndex + 1] === ages[endIndex] + 10) {
      endIndex += 1
    }

    const startAge = ages[startIndex]
    const endAge = ages[endIndex]
    ageRanges.push(
      startAge === endAge ? `${startAge}대` : `${startAge}~${endAge}대`,
    )
    startIndex = endIndex + 1
  }

  return `${ageRanges.join(', ')} ${customer.nationality}`
}

function sortSessions(sessions: ConsultationSession[]) {
  return [...sessions].sort(
    (left, right) =>
      Number(Boolean(right.isPinned)) - Number(Boolean(left.isPinned)) ||
      right.updatedAt - left.updatedAt,
  )
}

function readConsultationHistory(): ConsultationHistory {
  try {
    const storedHistory = window.localStorage.getItem(
      CONSULTATION_HISTORY_STORAGE_KEY,
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

function writeConsultationHistory(history: ConsultationHistory) {
  try {
    window.localStorage.setItem(
      CONSULTATION_HISTORY_STORAGE_KEY,
      JSON.stringify(history),
    )
  } catch {
    // 브라우저 저장소를 사용할 수 없는 환경에서는 현재 대화만 유지한다.
  }
}

function useTypewriter(
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

function useCategorySequence(isActive: boolean, isInstant = false) {
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

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" />
    </svg>
  )
}

function StarterPromptIcon({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2" />
      </svg>
    )
  }

  if (index === 1) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10h16v9H4zM3 10l2-5h14l2 5M8 14h3" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
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
  const [storedHistory] = useState(readConsultationHistory)
  const storedActiveSession =
    storedHistory.sessions.find(
      (session) => session.id === storedHistory.activeSessionId,
    ) ?? storedHistory.sessions[0]
  const [sessions, setSessions] = useState<ConsultationSession[]>(
    () => storedHistory.sessions,
  )
  const sessionsRef = useRef<ConsultationSession[]>(storedHistory.sessions)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    () => storedActiveSession?.id ?? null,
  )
  const [isRestoredSession, setIsRestoredSession] = useState(
    () => Boolean(storedActiveSession),
  )
  const [openSessionMenuId, setOpenSessionMenuId] = useState<string | null>(
    null,
  )
  const [editingSessionId, setEditingSessionId] = useState<string | null>(
    null,
  )
  const [editingSessionTitle, setEditingSessionTitle] = useState('')
  const [sessionPendingDeletion, setSessionPendingDeletion] =
    useState<ConsultationSession | null>(null)
  const [prompt, setPrompt] = useState('')
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(
    () => storedActiveSession?.pendingPrompt ?? null,
  )
  const [submittedPrompt, setSubmittedPrompt] = useState<string | null>(
    () => storedActiveSession?.submittedPrompt ?? null,
  )
  const [assistantMessage, setAssistantMessage] = useState<string | null>(
    () => storedActiveSession?.assistantMessage ?? null,
  )
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false)
  const [isPromptExpanded, setIsPromptExpanded] = useState(false)
  const [selectedCategory, setSelectedCategory] =
    useState<StoreCategoryCode | null>(
      () => storedActiveSession?.selectedCategory ?? null,
    )
  const [confirmedCategory, setConfirmedCategory] =
    useState<StoreCategoryCode | null>(
      () => storedActiveSession?.confirmedCategory ?? null,
    )
  const [customCategory, setCustomCategory] = useState(
    () => storedActiveSession?.customCategory ?? '',
  )
  const [confirmedCustomCategory, setConfirmedCustomCategory] = useState(
    () => storedActiveSession?.confirmedCustomCategory ?? '',
  )
  const [confirmedLocation, setConfirmedLocation] =
    useState<LocationSelection | null>(
      () => storedActiveSession?.confirmedLocation ?? null,
    )
  const [confirmedTargetCustomer, setConfirmedTargetCustomer] =
    useState<TargetCustomerSelection | null>(
      () => storedActiveSession?.confirmedTargetCustomer ?? null,
    )
  const [confirmedOperatingHours, setConfirmedOperatingHours] =
    useState<OperatingHours | null>(
      () => storedActiveSession?.confirmedOperatingHours ?? null,
    )
  const [additionalDetails, setAdditionalDetails] = useState(
    () => storedActiveSession?.additionalDetails ?? '',
  )
  const [confirmedAdditionalDetails, setConfirmedAdditionalDetails] =
    useState(() => storedActiveSession?.confirmedAdditionalDetails ?? '')
  const [isSummaryConfirmed, setIsSummaryConfirmed] = useState(
    () => storedActiveSession?.isSummaryConfirmed ?? false,
  )
  const [isSubmittingAnalysisReport, setIsSubmittingAnalysisReport] =
    useState(false)
  const [analysisReportSubmissionError, setAnalysisReportSubmissionError] =
    useState<string | null>(null)
  const promptInputRef = useRef<HTMLTextAreaElement>(null)
  const promptHeightRef = useRef(44)
  const promptLengthRef = useRef(0)
  const conversationMessagesRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const introRequestRef = useRef<AbortController | null>(null)
  const analysisReportRequestRef = useRef<AbortController | null>(null)

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
      ? '좋아요. 마지막으로 이 입지에서 가장 먼저 만나고 싶은 주요 고객층을 선택해 주세요.'
      : null
  const targetCustomerConfirmationMessage =
    confirmedTargetCustomer
      ? '좋아요. 주요 운영 시간대를 설정해 주세요.'
      : null
  const operatingHoursConfirmationMessage =
    confirmedOperatingHours
      ? '좋아요. 지금까지 알려주신 정보가 맞는지 확인해 주세요.'
      : null
  const consultationReadyMessage =
    confirmedCategoryLabel && confirmedLocation && confirmedTargetCustomer && confirmedOperatingHours && isSummaryConfirmed
      ? `${confirmedCategoryLabel} 업종의 ${confirmedLocation.displayName} 분석 요청을 전송했어요. ${formatTargetCustomerGroup(confirmedTargetCustomer)} 고객층과 ${confirmedOperatingHours.operatingDays ?? '평일'} ${confirmedOperatingHours.startTime}~${confirmedOperatingHours.endTime} 운영 시간을 기준으로 분석할게요.`
      : null
  const initialTypewriter = useTypewriter(
    assistantMessage,
    520,
    24,
    isRestoredSession,
  )
  const followupTypewriter = useTypewriter(
    followupMessage,
    ASSISTANT_RESPONSE_LOADING_DELAY,
    28,
    isRestoredSession,
  )
  const locationConfirmationTypewriter = useTypewriter(
    locationConfirmationMessage,
    ASSISTANT_RESPONSE_LOADING_DELAY,
    28,
    isRestoredSession,
  )
  const targetCustomerConfirmationTypewriter = useTypewriter(
    targetCustomerConfirmationMessage,
    ASSISTANT_RESPONSE_LOADING_DELAY,
    28,
    isRestoredSession,
  )
  const operatingHoursConfirmationTypewriter = useTypewriter(
    operatingHoursConfirmationMessage,
    ASSISTANT_RESPONSE_LOADING_DELAY,
    28,
    isRestoredSession,
  )
  const consultationReadyTypewriter = useTypewriter(
    consultationReadyMessage,
    ASSISTANT_RESPONSE_LOADING_DELAY,
    26,
    isRestoredSession,
  )
  const categorySequence = useCategorySequence(
    initialTypewriter.isComplete,
    isRestoredSession,
  )
  const pinnedSessions = sessions.filter((session) => session.isPinned)
  const unpinnedSessions = sessions.filter((session) => !session.isPinned)

  useEffect(() => {
    if (!activeSessionId) {
      writeConsultationHistory({
        activeSessionId: null,
        sessions: sessionsRef.current,
      })
      return
    }

    const activeSession: ConsultationSession = {
      id: activeSessionId,
      title:
        sessionsRef.current.find((session) => session.id === activeSessionId)
          ?.title ?? createSessionTitle(submittedPrompt ?? pendingPrompt ?? '새 상담'),
      isPinned:
        sessionsRef.current.find((session) => session.id === activeSessionId)
          ?.isPinned ?? false,
      createdAt:
        sessionsRef.current.find((session) => session.id === activeSessionId)
          ?.createdAt ??
        Date.now(),
      updatedAt: Date.now(),
      pendingPrompt,
      submittedPrompt,
      assistantMessage,
      selectedCategory,
      confirmedCategory,
      customCategory,
      confirmedCustomCategory,
      confirmedLocation,
      confirmedTargetCustomer,
      confirmedOperatingHours,
      additionalDetails,
      confirmedAdditionalDetails,
      isSummaryConfirmed,
    }

    setSessions((currentSessions) => {
      const nextSessions = sortSessions([
        activeSession,
        ...currentSessions.filter((session) => session.id !== activeSessionId),
      ])

      sessionsRef.current = nextSessions
      writeConsultationHistory({ activeSessionId, sessions: nextSessions })

      return nextSessions
    })
  }, [
    activeSessionId,
    additionalDetails,
    assistantMessage,
    confirmedAdditionalDetails,
    confirmedCategory,
    confirmedCustomCategory,
    confirmedLocation,
    confirmedOperatingHours,
    confirmedTargetCustomer,
    customCategory,
    isSummaryConfirmed,
    pendingPrompt,
    selectedCategory,
    submittedPrompt,
  ])

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
  }, [assistantMessage, submittedPrompt])

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
    confirmedTargetCustomer,
    confirmedOperatingHours,
    followupTypewriter.isComplete,
    locationConfirmationTypewriter.isComplete,
    targetCustomerConfirmationTypewriter.isComplete,
    operatingHoursConfirmationTypewriter.isComplete,
    isSummaryConfirmed,
  ])

  function resetConsulting() {
    introRequestRef.current?.abort()
    analysisReportRequestRef.current?.abort()
    setActiveSessionId(null)
    setIsRestoredSession(false)
    setPrompt('')
    setPendingPrompt(null)
    setSubmittedPrompt(null)
    setAssistantMessage(null)
    setSelectedCategory(null)
    setConfirmedCategory(null)
    setCustomCategory('')
    setConfirmedCustomCategory('')
    setConfirmedLocation(null)
    setConfirmedTargetCustomer(null)
    setConfirmedOperatingHours(null)
    setAdditionalDetails('')
    setConfirmedAdditionalDetails('')
    setIsSummaryConfirmed(false)
    setIsSubmittingAnalysisReport(false)
    setAnalysisReportSubmissionError(null)
    setIsAttachmentMenuOpen(false)
    setIsPromptExpanded(false)
  }

  function restoreSession(session: ConsultationSession) {
    introRequestRef.current?.abort()
    analysisReportRequestRef.current?.abort()
    setIsRestoredSession(true)
    setPrompt('')
    setPendingPrompt(session.pendingPrompt)
    setSubmittedPrompt(session.submittedPrompt)
    setAssistantMessage(session.assistantMessage)
    setSelectedCategory(session.selectedCategory)
    setConfirmedCategory(session.confirmedCategory)
    setCustomCategory(session.customCategory)
    setConfirmedCustomCategory(session.confirmedCustomCategory)
    setConfirmedLocation(session.confirmedLocation)
    setConfirmedTargetCustomer(session.confirmedTargetCustomer)
    setConfirmedOperatingHours(session.confirmedOperatingHours)
    setAdditionalDetails(session.additionalDetails)
    setConfirmedAdditionalDetails(session.confirmedAdditionalDetails)
    setIsSummaryConfirmed(session.isSummaryConfirmed)
    setIsSubmittingAnalysisReport(false)
    setAnalysisReportSubmissionError(null)
    setIsAttachmentMenuOpen(false)
    setIsPromptExpanded(false)
  }

  function handleSessionSelect(session: ConsultationSession) {
    if (session.id === activeSessionId) {
      return
    }

    restoreSession(session)
    setActiveSessionId(session.id)
    setOpenSessionMenuId(null)
  }

  function saveSessions(
    nextSessions: ConsultationSession[],
    nextActiveSessionId = activeSessionId,
  ) {
    const sortedSessions = sortSessions(nextSessions)

    sessionsRef.current = sortedSessions
    setSessions(sortedSessions)
    writeConsultationHistory({
      activeSessionId: nextActiveSessionId,
      sessions: sortedSessions,
    })
  }

  function handleSessionMenuToggle(
    event: ReactMouseEvent<HTMLButtonElement>,
    sessionId: string,
  ) {
    event.stopPropagation()
    setOpenSessionMenuId((currentId) =>
      currentId === sessionId ? null : sessionId,
    )
  }

  function handleSessionRenameStart(
    event: ReactMouseEvent<HTMLButtonElement>,
    session: ConsultationSession,
  ) {
    event.stopPropagation()
    setEditingSessionId(session.id)
    setEditingSessionTitle(session.title)
    setOpenSessionMenuId(null)
  }

  function handleSessionRenameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextTitle = editingSessionTitle.trim()

    if (!editingSessionId || !nextTitle) {
      return
    }

    saveSessions(
      sessionsRef.current.map((session) =>
        session.id === editingSessionId
          ? { ...session, title: nextTitle }
          : session,
      ),
    )
    setEditingSessionId(null)
    setEditingSessionTitle('')
  }

  function handleSessionPin(
    event: ReactMouseEvent<HTMLButtonElement>,
    sessionId: string,
  ) {
    event.stopPropagation()
    saveSessions(
      sessionsRef.current.map((session) =>
        session.id === sessionId
          ? { ...session, isPinned: !session.isPinned }
          : session,
      ),
    )
    setOpenSessionMenuId(null)
  }

  function handleSessionDelete(
    event: ReactMouseEvent<HTMLButtonElement>,
    sessionId: string,
  ) {
    event.stopPropagation()

    setSessionPendingDeletion(
      sessionsRef.current.find((session) => session.id === sessionId) ?? null,
    )
    setOpenSessionMenuId(null)
  }

  function handleSessionDeleteConfirm() {
    if (!sessionPendingDeletion) {
      return
    }

    const isActiveSession = activeSessionId === sessionPendingDeletion.id
    saveSessions(
      sessionsRef.current.filter(
        (session) => session.id !== sessionPendingDeletion.id,
      ),
      isActiveSession ? null : activeSessionId,
    )
    setSessionPendingDeletion(null)

    if (isActiveSession) {
      resetConsulting()
    }
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

    setActiveSessionId(createSessionId())
    setIsRestoredSession(false)
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
    setConfirmedTargetCustomer(null)
    setConfirmedOperatingHours(null)
    setConfirmedAdditionalDetails('')
    setIsSummaryConfirmed(false)
    setAnalysisReportSubmissionError(null)
  }

  function handleTargetCustomerConfirm(customer: TargetCustomerSelection) {
    setConfirmedTargetCustomer(customer)
    setConfirmedOperatingHours(null)
    setConfirmedAdditionalDetails('')
    setIsSummaryConfirmed(false)
    setAnalysisReportSubmissionError(null)
  }

  function handleTargetCustomerChange() {
    setConfirmedTargetCustomer(null)
    setConfirmedOperatingHours(null)
    setIsSummaryConfirmed(false)
    setAnalysisReportSubmissionError(null)
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
    setIsSummaryConfirmed(false)
    setAnalysisReportSubmissionError(null)
  }

  function handleSummaryLocationChange(location: LocationSelection) {
    setConfirmedLocation(location)
    setConfirmedTargetCustomer(null)
    setConfirmedOperatingHours(null)
    setIsSummaryConfirmed(false)
    setAnalysisReportSubmissionError(null)
  }

  async function handleSummaryConfirm() {
    if (
      !confirmedCategoryLabel ||
      !confirmedLocation ||
      !confirmedTargetCustomer ||
      !confirmedOperatingHours
    ) {
      return
    }

    analysisReportRequestRef.current?.abort()
    const controller = new AbortController()
    analysisReportRequestRef.current = controller
    setIsSubmittingAnalysisReport(true)
    setAnalysisReportSubmissionError(null)

    try {
      await requestLocationAnalysisReport(
        {
          region:
            confirmedLocation.address ||
            confirmedLocation.roadAddress ||
            confirmedLocation.displayName,
          category: confirmedCategoryLabel,
          targetCustomerGroup: formatTargetCustomerGroup(
            confirmedTargetCustomer,
          ),
          operatingHours: `${confirmedOperatingHours.operatingDays ?? '평일'} ${confirmedOperatingHours.startTime}~${confirmedOperatingHours.endTime}`,
        },
        controller.signal,
      )

      if (!controller.signal.aborted) {
        setConfirmedAdditionalDetails(additionalDetails.trim())
        setIsSummaryConfirmed(true)
      }
    } catch {
      if (!controller.signal.aborted) {
        setAnalysisReportSubmissionError(
          '분석 요청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.',
        )
      }
    } finally {
      if (analysisReportRequestRef.current === controller) {
        analysisReportRequestRef.current = null
        setIsSubmittingAnalysisReport(false)
      }
    }
  }

  function handleOperatingHoursConfirm(operatingHours: OperatingHours) {
    setConfirmedOperatingHours(operatingHours)
    setConfirmedAdditionalDetails('')
    setIsSummaryConfirmed(false)
    setAnalysisReportSubmissionError(null)
  }

  function handleOperatingHoursChange() {
    setConfirmedOperatingHours(null)
    setIsSummaryConfirmed(false)
    setAnalysisReportSubmissionError(null)
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

  function handleStarterPromptSelect(starterPrompt: string) {
    if (isCollectingCategory || isTransitioningToConversation) {
      return
    }

    setPrompt(starterPrompt)
    setIsPromptExpanded(false)

    requestAnimationFrame(() => promptInputRef.current?.focus())
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
        {isLocked ? (
          <S.ComposerHint>
            {!categorySequence.isComplete
              ? 'AI가 답변과 선택지를 작성하고 있습니다.'
              : !confirmedCategory
                ? '카테고리를 선택하면 다음 상담 단계로 이어집니다.'
                : !confirmedLocation
                  ? '희망 장소를 선택하면 입력 정보를 확인할 수 있습니다.'
                  : !confirmedTargetCustomer
                    ? '주요 고객층을 선택하면 입력 정보를 확인할 수 있습니다.'
                    : !confirmedOperatingHours
                      ? '주요 운영 시간을 선택하면 입력 정보를 확인할 수 있습니다.'
                      : !isSummaryConfirmed
                        ? '입력한 정보를 확인하면 상권 분석을 준비합니다.'
                        : '확인한 조건으로 상권 분석을 준비하고 있습니다.'}
          </S.ComposerHint>
        ) : null}
      </S.ComposerArea>
    )
  }

  function renderSessionItems(sessionItems: ConsultationSession[]) {
    return sessionItems.map((session) => (
      <S.HistoryItem key={session.id} data-active={session.id === activeSessionId}>
        {editingSessionId === session.id ? (
          <S.HistoryRenameForm onSubmit={handleSessionRenameSubmit}>
            <S.HistoryRenameInput
              value={editingSessionTitle}
              onChange={(event) =>
                setEditingSessionTitle(event.currentTarget.value)
              }
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setEditingSessionId(null)
                  setEditingSessionTitle('')
                }
              }}
              maxLength={60}
              autoFocus
              aria-label="세션 이름 변경"
            />
          </S.HistoryRenameForm>
        ) : (
          <S.HistorySelectButton
            type="button"
            aria-current={session.id === activeSessionId ? 'page' : undefined}
            onClick={() => handleSessionSelect(session)}
          >
            <S.HistoryTitle>{formatSessionPreview(session.title)}</S.HistoryTitle>
          </S.HistorySelectButton>
        )}

        {editingSessionId !== session.id ? (
          <S.HistoryActions>
            <S.HistoryMenuToggle
              type="button"
              aria-label={`${session.title} 메뉴`}
              aria-haspopup="menu"
              aria-expanded={openSessionMenuId === session.id}
              onClick={(event) => handleSessionMenuToggle(event, session.id)}
            >
              ⋮
            </S.HistoryMenuToggle>

            {openSessionMenuId === session.id ? (
              <S.HistoryMenu role="menu">
                <S.HistoryMenuItem
                  type="button"
                  role="menuitem"
                  onClick={(event) => handleSessionRenameStart(event, session)}
                >
                  이름 변경
                </S.HistoryMenuItem>
                <S.HistoryMenuItem
                  type="button"
                  role="menuitem"
                  onClick={(event) => handleSessionPin(event, session.id)}
                >
                  {session.isPinned ? '고정 해제' : '고정하기'}
                </S.HistoryMenuItem>
                <S.HistoryMenuItem
                  type="button"
                  role="menuitem"
                  data-danger="true"
                  onClick={(event) => handleSessionDelete(event, session.id)}
                >
                  삭제
                </S.HistoryMenuItem>
              </S.HistoryMenu>
            ) : null}
          </S.HistoryActions>
        ) : null}
      </S.HistoryItem>
    ))
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

        {pinnedSessions.length > 0 ? (
          <S.PinnedSection>
            <S.PinnedLabel>고정됨</S.PinnedLabel>
            <S.HistoryList aria-label="고정된 채팅 목록">
              {renderSessionItems(pinnedSessions)}
            </S.HistoryList>
          </S.PinnedSection>
        ) : null}

        <S.SidebarContent>
          <S.SidebarLabel>채팅</S.SidebarLabel>
          {sessions.length === 0 ? (
            <S.EmptyHistory>아직 저장된 채팅이 없습니다.</S.EmptyHistory>
          ) : unpinnedSessions.length > 0 ? (
            <S.HistoryList aria-label="저장된 상담 목록">
              {renderSessionItems(unpinnedSessions)}
            </S.HistoryList>
          ) : null}
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
                          <TargetCustomerPanel
                            confirmedCustomer={confirmedTargetCustomer}
                            onConfirm={handleTargetCustomerConfirm}
                          />
                        ) : null}
                      </S.AssistantMessageContent>
                    </S.AssistantMessageRow>
                  </>
                ) : null}

                {confirmedTargetCustomer && confirmedLocation && confirmedCategoryLabel ? (
                  <>
                    <S.UserMessageRow>
                      <S.UserMessageBubble>
                        {confirmedTargetCustomer.ageGroups.join(', ')} ·{' '}
                        {confirmedTargetCustomer.nationality}
                      </S.UserMessageBubble>
                    </S.UserMessageRow>
                    <S.AssistantMessageRow>
                      <S.AssistantAvatar aria-hidden="true">
                        <img src="/pingdom-favicon.png" alt="" />
                      </S.AssistantAvatar>
                      <S.AssistantMessageContent>
                        <S.AssistantFollowup
                          role="status"
                          aria-busy={targetCustomerConfirmationTypewriter.isTyping}
                        >
                          {targetCustomerConfirmationTypewriter.displayedText ? (
                            <>
                              {targetCustomerConfirmationTypewriter.displayedText}
                              {targetCustomerConfirmationTypewriter.isTyping ? (
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

                        {targetCustomerConfirmationTypewriter.isComplete ? (
                          <OperatingHoursPanel
                            confirmedOperatingHours={confirmedOperatingHours}
                            onConfirm={handleOperatingHoursConfirm}
                          />
                        ) : null}
                      </S.AssistantMessageContent>
                    </S.AssistantMessageRow>
                  </>
                ) : null}

                {confirmedOperatingHours && confirmedTargetCustomer && confirmedLocation && confirmedCategoryLabel ? (
                  <>
                    <S.UserMessageRow>
                      <S.UserMessageBubble>
                        {confirmedOperatingHours.operatingDays ?? '평일'}{' '}
                        {confirmedOperatingHours.startTime} ~{' '}
                        {confirmedOperatingHours.endTime}
                      </S.UserMessageBubble>
                    </S.UserMessageRow>
                    <S.AssistantMessageRow>
                      <S.AssistantAvatar aria-hidden="true">
                        <img src="/pingdom-favicon.png" alt="" />
                      </S.AssistantAvatar>
                      <S.AssistantMessageContent>
                        <S.AssistantFollowup
                          role="status"
                          aria-busy={operatingHoursConfirmationTypewriter.isTyping}
                        >
                          {operatingHoursConfirmationTypewriter.displayedText ? (
                            <>
                              {operatingHoursConfirmationTypewriter.displayedText}
                              {operatingHoursConfirmationTypewriter.isTyping ? (
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

                        {operatingHoursConfirmationTypewriter.isComplete ? (
                          <ConsultationSummaryPanel
                            categoryLabel={confirmedCategoryLabel}
                            location={confirmedLocation}
                            targetCustomer={confirmedTargetCustomer}
                            operatingHours={confirmedOperatingHours}
                            categoryOptions={STORE_CATEGORY_LABELS}
                            additionalDetails={additionalDetails}
                            isConfirmed={isSummaryConfirmed}
                            isSubmitting={isSubmittingAnalysisReport}
                            submissionError={analysisReportSubmissionError}
                            onAdditionalDetailsChange={setAdditionalDetails}
                            onCategoryChange={handleSummaryCategoryChange}
                            onLocationChange={handleSummaryLocationChange}
                            onTargetCustomerChange={handleTargetCustomerChange}
                            onOperatingHoursChange={handleOperatingHoursChange}
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
                        {consultationReadyTypewriter.displayedText ? (
                          <>
                            {consultationReadyTypewriter.displayedText}
                            {consultationReadyTypewriter.isTyping ? (
                              <S.TypingCursor aria-hidden="true" />
                            ) : null}
                          </>
                        ) : null}
                        {!consultationReadyTypewriter.displayedText ? (
                          <S.TypingIndicator aria-label="AI가 답변을 작성하고 있습니다">
                            <span />
                            <span />
                            <span />
                          </S.TypingIndicator>
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
                            ? 'AI가 다음 질문을 작성하고 있어요'
                          : !confirmedTargetCustomer
                            ? '주요 고객층을 선택해 주세요'
                            : !targetCustomerConfirmationTypewriter.isComplete
                              ? 'AI가 다음 질문을 작성하고 있어요'
                            : !confirmedOperatingHours
                              ? '주요 운영 시간을 선택해 주세요'
                              : !operatingHoursConfirmationTypewriter.isComplete
                                ? 'AI가 다음 질문을 작성하고 있어요'
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
              <S.StarterPromptSection aria-label="상담 시작 추천 질문">
                <S.StarterPromptList>
                  {STARTER_PROMPTS.map((starterPrompt) => (
                    <S.StarterPromptButton
                      key={starterPrompt}
                      type="button"
                      onClick={() => handleStarterPromptSelect(starterPrompt)}
                    >
                      <S.StarterPromptIcon>
                        <StarterPromptIcon index={STARTER_PROMPTS.indexOf(starterPrompt)} />
                      </S.StarterPromptIcon>
                      <span>{starterPrompt}</span>
                    </S.StarterPromptButton>
                  ))}
                </S.StarterPromptList>
              </S.StarterPromptSection>
            </S.EmptyState>
          )}
        </S.ChatMain>
      </S.Workspace>

      {sessionPendingDeletion ? (
        <S.DeleteDialogBackdrop
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSessionPendingDeletion(null)
            }
          }}
        >
          <S.DeleteDialog
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-session-title"
            aria-describedby="delete-session-description"
          >
            <S.DeleteDialogTitle id="delete-session-title">
              채팅을 삭제할까요?
            </S.DeleteDialogTitle>
            <S.DeleteDialogDescription id="delete-session-description">
              “{sessionPendingDeletion.title}” 대화와 저장된 정보가 삭제됩니다.
            </S.DeleteDialogDescription>
            <S.DeleteDialogActions>
              <S.DeleteDialogButton
                type="button"
                onClick={() => setSessionPendingDeletion(null)}
                autoFocus
              >
                취소
              </S.DeleteDialogButton>
              <S.DeleteDialogButton
                type="button"
                data-danger="true"
                onClick={handleSessionDeleteConfirm}
              >
                삭제
              </S.DeleteDialogButton>
            </S.DeleteDialogActions>
          </S.DeleteDialog>
        </S.DeleteDialogBackdrop>
      ) : null}
    </S.PageShell>
  )
}

export default AiHomePage
