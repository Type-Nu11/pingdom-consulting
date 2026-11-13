import { useEffect, useRef, useState } from 'react'
import type { ConsultationSession } from '../model/consultation.types'
import { createSessionTitle, sortSessions } from '../model/consultationHistory'
import { readConsultationHistory, writeConsultationHistory } from '../storage/consultationHistoryStorage'

type ConsultationDraft = Omit<ConsultationSession, 'id' | 'title' | 'isPinned' | 'createdAt' | 'updatedAt'>

type ConsultationHistoryOptions = {
  userId: number
  draft: ConsultationDraft
  onRestore: (session: ConsultationSession) => void
  onReset: () => void
  onDeleteReport: (sessionId: string) => void
}

// The account-keyed page owns draft fields and request cancellation.
export function useConsultationHistory({ userId, draft, onRestore, onReset, onDeleteReport }: ConsultationHistoryOptions) {
  const [storedHistory] = useState(() => readConsultationHistory(userId))
  const [sessions, setSessions] = useState<ConsultationSession[]>(() => storedHistory.sessions)
  const sessionsRef = useRef<ConsultationSession[]>(storedHistory.sessions)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [openSessionMenuId, setOpenSessionMenuId] = useState<string | null>(null)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editingSessionTitle, setEditingSessionTitle] = useState('')
  const [sessionPendingDeletion, setSessionPendingDeletion] = useState<ConsultationSession | null>(null)
  const {
    pendingPrompt, submittedPrompt, assistantMessage, selectedCategory, confirmedCategory,
    customCategory, confirmedCustomCategory, confirmedLocation, confirmedTargetCustomer,
    confirmedOperatingHours, additionalDetails, confirmedAdditionalDetails, isSummaryConfirmed,
  } = draft

  useEffect(() => {
    if (!activeSessionId) {
      writeConsultationHistory({ activeSessionId: null, sessions: sessionsRef.current }, userId)
      return
    }

    const current = sessionsRef.current.find(session => session.id === activeSessionId)
    const activeSession: ConsultationSession = {
      id: activeSessionId,
      title: current?.title ?? createSessionTitle(submittedPrompt ?? pendingPrompt ?? '새 상담'),
      isPinned: current?.isPinned ?? false,
      createdAt: current?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      pendingPrompt, submittedPrompt, assistantMessage, selectedCategory, confirmedCategory,
      customCategory, confirmedCustomCategory, confirmedLocation, confirmedTargetCustomer,
      confirmedOperatingHours, additionalDetails, confirmedAdditionalDetails, isSummaryConfirmed,
    }

    setSessions(currentSessions => {
      const nextSessions = sortSessions([activeSession, ...currentSessions.filter(session => session.id !== activeSessionId)])
      sessionsRef.current = nextSessions
      writeConsultationHistory({ activeSessionId, sessions: nextSessions }, userId)
      return nextSessions
    })
  }, [
    activeSessionId, additionalDetails, assistantMessage, confirmedAdditionalDetails,
    confirmedCategory, confirmedCustomCategory, confirmedLocation, confirmedOperatingHours,
    confirmedTargetCustomer, customCategory, isSummaryConfirmed, pendingPrompt, selectedCategory,
    submittedPrompt, userId,
  ])

  function saveSessions(nextSessions: ConsultationSession[], nextActiveSessionId = activeSessionId) {
    const sorted = sortSessions(nextSessions)
    sessionsRef.current = sorted
    setSessions(sorted)
    writeConsultationHistory({ activeSessionId: nextActiveSessionId, sessions: sorted }, userId)
  }

  function beginSession() {
    setActiveSessionId(crypto.randomUUID())
  }

  function startNewConsultation() {
    setActiveSessionId(null)
    onReset()
  }

  function selectSession(session: ConsultationSession) {
    if (session.id === activeSessionId) return
    onRestore(session)
    setActiveSessionId(session.id)
    setOpenSessionMenuId(null)
  }

  function toggleSessionMenu(sessionId: string) {
    setOpenSessionMenuId(current => current === sessionId ? null : sessionId)
  }

  function startSessionRename(session: ConsultationSession) {
    setEditingSessionId(session.id)
    setEditingSessionTitle(session.title)
    setOpenSessionMenuId(null)
  }

  function cancelSessionRename() {
    setEditingSessionId(null)
    setEditingSessionTitle('')
  }

  function submitSessionRename() {
    const title = editingSessionTitle.trim()
    if (!editingSessionId || !title) return
    saveSessions(sessionsRef.current.map(session => session.id === editingSessionId ? { ...session, title } : session))
    cancelSessionRename()
  }

  function pinSession(sessionId: string) {
    saveSessions(sessionsRef.current.map(session => session.id === sessionId ? { ...session, isPinned: !session.isPinned } : session))
    setOpenSessionMenuId(null)
  }

  function requestSessionDeletion(sessionId: string) {
    setSessionPendingDeletion(sessionsRef.current.find(session => session.id === sessionId) ?? null)
    setOpenSessionMenuId(null)
  }

  function cancelSessionDeletion() {
    setSessionPendingDeletion(null)
  }

  function confirmSessionDeletion() {
    if (!sessionPendingDeletion) return
    const isActive = activeSessionId === sessionPendingDeletion.id
    saveSessions(sessionsRef.current.filter(session => session.id !== sessionPendingDeletion.id), isActive ? null : activeSessionId)
    onDeleteReport(sessionPendingDeletion.id)
    setSessionPendingDeletion(null)
    if (isActive) startNewConsultation()
  }

  return {
    sessions, activeSessionId,
    pinnedSessions: sessions.filter(session => session.isPinned),
    unpinnedSessions: sessions.filter(session => !session.isPinned),
    openSessionMenuId, editingSessionId, editingSessionTitle, setEditingSessionTitle, sessionPendingDeletion,
    beginSession, startNewConsultation, selectSession, toggleSessionMenu, startSessionRename,
    cancelSessionRename, submitSessionRename, pinSession, requestSessionDeletion,
    cancelSessionDeletion, confirmSessionDeletion,
  }
}
