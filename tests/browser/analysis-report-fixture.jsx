import React, { useEffect, useLayoutEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AxiosError } from 'axios'
import { apiClient } from '../../src/features/api/apiClient'
import { useAnalysisReport } from '../../src/features/analysis/hooks/useAnalysisReport'
import { readLocationAnalysisReport, saveLocationAnalysisReport } from '../../src/features/analysis/locationAnalysisReportStorage'

window.reportQa = { requests: [], completions: 0, unexpected: [], reads: [], deferReads: false, downloads: [], revoked: [] }
const qa = window.reportQa
const nativeOpen = IDBFactory.prototype.open
IDBFactory.prototype.open = function (...args) {
  if (qa.blockStorage) throw new DOMException('Synthetic unavailable storage', 'SecurityError')
  return nativeOpen.apply(this, args)
}
const nativeGet = IDBObjectStore.prototype.get
IDBObjectStore.prototype.get = function (...args) {
  const request = nativeGet.apply(this, args)
  request.addEventListener('success', event => {
    if (!qa.deferReads || !request.onsuccess) return
    const handler = request.onsuccess
    request.onsuccess = null
    qa.reads.push(() => handler.call(request, event))
  }, { once: true })
  return request
}
const nativeClick = HTMLAnchorElement.prototype.click
HTMLAnchorElement.prototype.click = function () {
  if (!this.download) return nativeClick.call(this)
  qa.downloads.push({ filename: this.download, href: this.href, attached: this.isConnected })
}
const nativeRevoke = URL.revokeObjectURL
URL.revokeObjectURL = url => { qa.revoked.push(url); nativeRevoke(url) }
apiClient.defaults.adapter = config => new Promise((resolve, reject) => {
  if (config.url !== '/analysis/reports/location') {
    qa.unexpected.push(config.url); reject(new Error('Unexpected synthetic request')); return
  }
  qa.requests.push({
    config, payload: JSON.parse(config.data), signal: config.signal,
    resolve(filename = 'synthetic.pdf') {
      resolve({ config, data: new Blob(['%PDF-1.4 synthetic'], { type: 'application/pdf' }), status: 200, statusText: 'OK', headers: filename ? { 'content-disposition': `attachment; filename="${filename}"` } : {} })
    },
    reject(status = 502, code) {
      reject(new AxiosError('Synthetic failure', 'ERR_BAD_RESPONSE', config, {}, { config, status, data: { code }, headers: {} }))
    },
    timeout() { reject(new AxiosError('Synthetic timeout', 'ECONNABORTED', config)) },
  })
}).finally(() => { qa.completions += 1 })

function Session({ userId, switchAccount, unmount }) {
  const [activeSessionId, setActiveSessionId] = useState('session-a')
  const [confirmed, setConfirmed] = useState(false)
  const [typewriterComplete, setTypewriterComplete] = useState(false)
  const report = useAnalysisReport({ userId, activeSessionId, initialLoadingDelay: 1500 })
  const { analysisProgressStage, scheduleAnalysisLoading } = report
  useEffect(() => {
    if (analysisProgressStage !== 'message' || !typewriterComplete) return
    return scheduleAnalysisLoading()
  }, [analysisProgressStage, typewriterComplete, scheduleAnalysisLoading])
  useLayoutEffect(() => {
    qa.state = { userId, activeSessionId, confirmed, submitting: report.isSubmittingAnalysisReport,
      error: report.analysisReportSubmissionError, filename: report.locationAnalysisReport?.filename ?? null, stage: analysisProgressStage }
    const reset = () => {
      report.cancelAnalysisReport(); report.clearAnalysisProgressMessageTimer(); report.resetAnalysisReportState()
      setConfirmed(false); setTypewriterComplete(false)
    }
    qa.actions = {
      submit() {
        void report.submitAnalysisReport(() => ({ region: '합성 지역', category: '카페', targetCustomerGroup: '20대', operatingHours: '평일 09:00~18:00', email: `synthetic-${userId}@example.invalid`, privacyConsent: true }), () => setConfirmed(true), () => setConfirmed(false))
      },
      reset, cancel: report.cancelAnalysisReport, clearError: report.clearAnalysisReportError,
      select(id) { reset(); setActiveSessionId(id) },
      finishTypewriter() { setTypewriterComplete(true) },
      download: report.downloadAnalysisReport, delete: report.deleteReport,
      seed(id, sessionId, filename) { return saveLocationAnalysisReport(id, sessionId, { pdf: new Blob(['%PDF synthetic']), filename }) },
      async stored(id, sessionId) { return (await readLocationAnalysisReport(id, sessionId))?.filename ?? null },
      switchAccount, unmount,
    }
  })
  return <p role="status">Synthetic report account {userId}</p>
}
function Fixture() {
  const [userId, setUserId] = useState(901)
  const [mounted, setMounted] = useState(true)
  return mounted ? <Session key={userId} userId={userId} switchAccount={setUserId} unmount={() => setMounted(false)} /> : <p>Unmounted</p>
}
createRoot(document.getElementById('root')).render(<React.StrictMode><Fixture /></React.StrictMode>)
