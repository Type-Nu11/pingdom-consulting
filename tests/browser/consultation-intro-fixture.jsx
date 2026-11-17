import React, { useLayoutEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AxiosError } from 'axios'
import { apiClient } from '../../src/features/api/apiClient'
import { useConsultationIntro } from '../../src/features/consultation/hooks/useConsultationIntro'

// Exercise the real hook, API normalization and Axios cancellation. Deliberately
// let the transport finish after abort so stale responses cannot pass silently.
window.introQa = { requests: [], controllers: [], unexpected: [], completions: 0 }
const NativeAbortController = window.AbortController
window.AbortController = class extends NativeAbortController {
  constructor() {
    super()
    window.introQa.controllers.push(this)
  }
}
apiClient.defaults.adapter = config => new Promise((resolve, reject) => {
  if (config.url !== '/consultations/intro') {
    window.introQa.unexpected.push(config.url)
    reject(new Error('Unexpected synthetic request'))
    return
  }
  const request = {
    message: JSON.parse(config.data).message,
    signal: config.signal,
    resolve(message, source = 'gemini') {
      resolve({ config, data: { message, source }, status: 200, statusText: 'OK', headers: {} })
    },
    reject() { reject(new AxiosError('Synthetic failure', 'ERR_BAD_RESPONSE', config, {}, { config, status: 502, data: {}, headers: {} })) },
  }
  window.introQa.requests.push(request)
}).finally(() => { window.introQa.completions += 1 })

function Session({ userId, switchAccount, unmount }) {
  const [submittedPrompt, setSubmittedPrompt] = useState(new URLSearchParams(location.search).get('prompt'))
  const [assistantMessage, setAssistantMessage] = useState(null)
  const [renderCount, setRenderCount] = useState(0)
  const { cancelIntro } = useConsultationIntro({ submittedPrompt, assistantMessage, setAssistantMessage })
  useLayoutEffect(() => {
    window.introQa.state = { userId, submittedPrompt, assistantMessage, renderCount }
    window.introQa.actions = {
      submit(prompt) { setAssistantMessage(null); setSubmittedPrompt(prompt) },
      reset() { cancelIntro(); setSubmittedPrompt(null); setAssistantMessage(null) },
      restore(prompt, message) { cancelIntro(); setSubmittedPrompt(prompt); setAssistantMessage(message) },
      cancel: cancelIntro,
      render() { setRenderCount(value => value + 1) },
      switchAccount, unmount,
    }
  })
  return <p role="status">Synthetic intro account {userId}</p>
}

function Fixture() {
  const [userId, setUserId] = useState(901)
  const [mounted, setMounted] = useState(true)
  return mounted ? <Session key={userId} userId={userId} switchAccount={setUserId} unmount={() => setMounted(false)} /> : <p role="status">Unmounted</p>
}

createRoot(document.getElementById('root')).render(<React.StrictMode><Fixture /></React.StrictMode>)
