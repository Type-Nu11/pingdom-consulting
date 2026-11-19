import React, { useLayoutEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { useTypewriter } from '../../src/features/consultation/hooks/useTypewriter'
import { useCategorySequence } from '../../src/features/consultation/hooks/useCategorySequence'
import { useConversationTransition } from '../../src/features/consultation/hooks/useConversationTransition'

const qa = window.animationQa = {}
// Count only the non-zero timer delays used by these hooks. Keep the real
// cleanup functions and Playwright's clock rather than replacing the lifecycles.
const timers = new Map()
const trackedDelays = new Set([16, 38, 90, 220, 480])
const timeout = window.setTimeout.bind(window)
const interval = window.setInterval.bind(window)
const clearTimeout = window.clearTimeout.bind(window)
const clearInterval = window.clearInterval.bind(window)
window.setTimeout = (callback, delay, ...args) => {
  if (!trackedDelays.has(delay) || typeof callback !== 'function') return timeout(callback, delay, ...args)
  const id = timeout(() => { timers.delete(id); callback(...args) }, delay)
  timers.set(id, ['timeout', delay])
  return id
}
window.setInterval = (callback, delay, ...args) => {
  const id = interval(callback, delay, ...args)
  if (trackedDelays.has(delay)) timers.set(id, ['interval', delay])
  return id
}
window.clearTimeout = id => { timers.delete(id); clearTimeout(id) }
window.clearInterval = id => { timers.delete(id); clearInterval(id) }
qa.timers = () => [...timers.values()]

function Session({ account, switchAccount, unmount }) {
  const [message, setMessage] = useState(null)
  const [instant, setInstant] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [pendingPrompt, setPendingPrompt] = useState(null)
  const [submittedPrompt, setSubmittedPrompt] = useState(null)
  const [renderCount, setRenderCount] = useState(0)
  const text = useTypewriter(message, 90, 16, instant)
  const category = useCategorySequence(showCategories, instant)
  useConversationTransition(pendingPrompt, setSubmittedPrompt, setPendingPrompt)

  useLayoutEffect(() => {
    qa.state = { account, text, category, pendingPrompt, submittedPrompt, renderCount }
    qa.run = (name, ...args) => flushSync(() => ({
      submit: setPendingPrompt,
      render() { setRenderCount(value => value + 1) },
      apply(value, active, restored = false) {
        setMessage(value); setShowCategories(active); setInstant(restored)
      },
      restore(pending, submitted) {
        setPendingPrompt(pending); setSubmittedPrompt(submitted); setInstant(true)
      },
      reset() {
        setPendingPrompt(null); setSubmittedPrompt(null)
        setMessage(null); setShowCategories(false); setInstant(false)
      },
      switchAccount, unmount,
    })[name](...args))
  })
  return <p role="status">Synthetic animation account {account}</p>
}

function Fixture() {
  const [account, switchAccount] = useState(901)
  const [mounted, setMounted] = useState(true)
  return mounted ? <Session key={account} account={account} switchAccount={switchAccount} unmount={() => setMounted(false)} /> : <p role="status">Unmounted</p>
}
createRoot(document.getElementById('root')).render(<React.StrictMode><Fixture /></React.StrictMode>)
