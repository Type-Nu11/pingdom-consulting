import React from 'react'
import { createRoot } from 'react-dom/client'
import { AxiosError } from 'axios'
import { Router } from '../../src/app/router/Router'
import { GlobalStyle } from '../../src/styles/globalStyle'
import { apiClient } from '../../src/features/api/apiClient'
import { saveAuthSession } from '../../src/features/auth/authSession'

window.qa = { requests: [], unexpected: [], mode: 'success', release: null }
window.qa.account = (id) => saveAuthSession({ accessToken: 'synthetic-only', user: { id, username: `synthetic-${id}`, email: `synthetic-${id}@example.test` } })
apiClient.defaults.adapter = async config => {
  window.qa.requests.push({ url: config.url, data: config.data })
  let data
  if (config.url === '/consultations/intro') data = { message: '합성 상담 안내', source: 'fallback' }
  else if (config.url === '/analysis/reports/location') {
    if (window.qa.mode === 'hold') await new Promise(resolve => { window.qa.release = resolve })
    if (window.qa.mode === 'failure') throw new AxiosError('Synthetic failure', 'ERR_BAD_RESPONSE', config, {}, { status: 502, config, data: {}, headers: {} })
    data = new Blob(['%PDF-1.4\nsynthetic-only\n%%EOF'], { type: 'application/pdf' })
  } else if (config.url === '/auth/logout') data = {}
  else { window.qa.unexpected.push(config.url); throw new Error('Unexpected synthetic request') }
  return { config, data, status: 200, statusText: 'OK', headers: { 'content-disposition': 'attachment; filename="synthetic.pdf"' } }
}
if (!sessionStorage.getItem('pingdom-consulting-auth-v1')) window.qa.account(901)
createRoot(document.getElementById('root')).render(<React.StrictMode><GlobalStyle /><Router /></React.StrictMode>)
