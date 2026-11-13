import React, { useLayoutEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { useConsultationHistory } from '../../src/features/consultation/hooks/useConsultationHistory'

const blankDraft = {
  pendingPrompt: null, submittedPrompt: null, assistantMessage: null,
  selectedCategory: null, confirmedCategory: null, customCategory: '', confirmedCustomCategory: '',
  confirmedLocation: null, confirmedTargetCustomer: null, confirmedOperatingHours: null,
  additionalDetails: '', confirmedAdditionalDetails: '', isSummaryConfirmed: false,
}
window.historyEvents = []

function AccountHistory({ userId, switchAccount }) {
  const [draft, setDraft] = useState(blankDraft)
  const history = useConsultationHistory({
    userId, draft,
    onRestore(session) {
      window.historyEvents.push({ kind: 'restore', userId, id: session.id })
      setDraft(Object.fromEntries(Object.keys(blankDraft).map(key => [key, session[key]])))
    },
    onReset() { window.historyEvents.push({ kind: 'reset', userId }); setDraft(blankDraft) },
    onDeleteReport(id) { window.historyEvents.push({ kind: 'delete-report', userId, id }) },
  })
  useLayoutEffect(() => {
    window.historyQa = {
      userId, sessions: history.sessions, active: history.activeSessionId, draft,
      menu: history.openSessionMenuId, editing: history.editingSessionId, title: history.editingSessionTitle,
      pendingDeletion: history.sessionPendingDeletion?.id ?? null,
      actions: {
        begin: history.beginSession, new: history.startNewConsultation,
        select: id => history.selectSession(history.sessions.find(session => session.id === id)),
        pin: history.pinSession, toggleMenu: history.toggleSessionMenu,
        rename: id => history.startSessionRename(history.sessions.find(session => session.id === id)),
        setTitle: history.setEditingSessionTitle, submitRename: history.submitSessionRename,
        cancelRename: history.cancelSessionRename,
        delete: history.requestSessionDeletion, cancelDelete: history.cancelSessionDeletion,
        confirmDelete: history.confirmSessionDeletion,
        changeDraft: fields => setDraft(current => ({ ...current, ...fields })),
        switchAccount,
      },
    }
  })
  return <p role="status">Synthetic account {userId}</p>
}

function Fixture() {
  const [userId, setUserId] = useState(901)
  return <AccountHistory key={userId} userId={userId} switchAccount={setUserId} />
}

createRoot(document.getElementById('root')).render(<React.StrictMode><Fixture /></React.StrictMode>)
