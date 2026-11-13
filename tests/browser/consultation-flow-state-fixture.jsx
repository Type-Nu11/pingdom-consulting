import React, { useLayoutEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { useConsultationFlow } from '../../src/features/consultation/hooks/useConsultationFlow'
import { useConsultationHistory } from '../../src/features/consultation/hooks/useConsultationHistory'

const fields = [
  'selectedCategory', 'confirmedCategory', 'customCategory', 'confirmedCustomCategory',
  'confirmedLocation', 'confirmedTargetCustomer', 'confirmedOperatingHours',
  'additionalDetails', 'confirmedAdditionalDetails', 'isSummaryConfirmed',
]
const emptyPrompt = { pendingPrompt: null, submittedPrompt: null, assistantMessage: null }

function AccountFlow({ userId, switchAccount }) {
  const flow = useConsultationFlow()
  const [prompt, setPrompt] = useState(emptyPrompt)
  const state = Object.fromEntries(fields.map(field => [field, flow[field]]))
  const history = useConsultationHistory({
    userId, draft: { ...prompt, ...state },
    onRestore(session) {
      setPrompt(Object.fromEntries(Object.keys(emptyPrompt).map(field => [field, session[field]])))
      flow.restoreFlow(session)
    },
    onReset() { setPrompt(emptyPrompt); flow.resetFlow() },
    onDeleteReport() {},
  })
  useLayoutEffect(() => {
    window.flowQa = {
      userId, state,
      confirmedCategoryLabel: flow.confirmedCategoryLabel,
      isSelectionConfirmed: flow.isSelectionConfirmed,
      canConfirmCategory: flow.canConfirmCategory,
      active: history.activeSessionId, sessions: history.sessions,
      actions: {
        ...Object.fromEntries(Object.entries(flow).filter(([, value]) => typeof value === 'function')),
        begin: () => { history.beginSession(); setPrompt({ ...emptyPrompt, submittedPrompt: '합성 새 상담' }) },
        new: history.startNewConsultation,
        select: id => history.selectSession(history.sessions.find(session => session.id === id)),
        rename: id => history.startSessionRename(history.sessions.find(session => session.id === id)),
        setTitle: history.setEditingSessionTitle, submitRename: history.submitSessionRename,
        pin: history.pinSession, delete: history.requestSessionDeletion,
        cancelDelete: history.cancelSessionDeletion, confirmDelete: history.confirmSessionDeletion,
        switchAccount,
      },
    }
  })
  return <p role="status">Synthetic flow account {userId}</p>
}

function Fixture() {
  const [userId, setUserId] = useState(901)
  return <AccountFlow key={userId} userId={userId} switchAccount={setUserId} />
}

createRoot(document.getElementById('root')).render(<React.StrictMode><Fixture /></React.StrictMode>)
