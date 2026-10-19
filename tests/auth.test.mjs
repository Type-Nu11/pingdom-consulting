import assert from 'node:assert/strict'
import { after, beforeEach, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { AxiosError } from 'axios'
import { createServer } from 'vite'

const values = new Map()
globalThis.sessionStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key),
}

// Vite로 실제 TypeScript 소스를 읽고 HTTP adapter만 대체합니다. 외부 서버는 호출하지 않습니다.
const server = await createServer({
  configFile: false,
  root: fileURLToPath(new URL('..', import.meta.url)),
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom',
})
const { apiClient } = await server.ssrLoadModule('/src/features/api/apiClient.ts')
const { login, logout } = await server.ssrLoadModule('/src/features/auth/authApi.ts')
const { getAuthSession, saveAuthSession } = await server.ssrLoadModule('/src/features/auth/authSession.ts')
const { requestLocationAnalysisReport, locationAnalysisReportErrorMessage } =
  await server.ssrLoadModule('/src/features/analysis/locationAnalysisReportApi.ts')

const owner = { id: 1, username: 'owner', email: 'owner@example.com' }
const session = (accessToken = 'old-token', user = owner) => ({ accessToken, user })
const response = (config, data = {}, headers = {}) => ({ config, data, status: 200, statusText: 'OK', headers })
const rejectHttp = (config, status) => Promise.reject(new AxiosError(
  'HTTP failure', 'ERR_BAD_REQUEST', config, {}, { config, data: {}, status, statusText: 'Error', headers: {} },
))
function deferred() {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}

beforeEach(() => { saveAuthSession(null); values.clear() })
after(async () => { await server.close(); delete globalThis.sessionStorage })

test('일반 로그인은 자격 증명을 변형하지 않고 쿠키를 허용하며 계정과 access token만 저장한다', async () => {
  apiClient.defaults.adapter = async (config) => {
    assert.equal(config.url, '/auth/login')
    assert.equal(config.withCredentials, true)
    assert.equal(config.headers.get('Authorization'), undefined)
    assert.deepEqual(JSON.parse(config.data), { username: 'owner', password: ' password ' })
    return response(config, { ...owner, accessToken: 'access', birthYear: 1998 })
  }
  await login(' owner ', ' password ')
  assert.deepEqual(getAuthSession(), session('access'))
  const stored = JSON.parse([...values.values()][0])
  assert.deepEqual(Object.keys(stored).sort(), ['accessToken', 'user'])
  assert.equal(JSON.stringify(stored).includes('password'), false)
})

test('로그인 실패에는 refresh나 자동 로그인 재시도를 하지 않는다', async () => {
  let calls = 0
  apiClient.defaults.adapter = (config) => { calls++; return rejectHttp(config, 401) }
  await assert.rejects(login('owner', 'password'), (error) => error.status === 401)
  assert.equal(calls, 1)
  assert.equal(getAuthSession(), null)
})

test('브라우저 검증 오류 코드를 보존하고 비밀번호 오류와 구별한다', async () => {
  apiClient.defaults.adapter = async (config) => {
    throw new AxiosError('Challenge', 'ERR_BAD_REQUEST', config, {}, {
      config, data: { code: 'PINGCHA_REQUIRED' }, status: 403, statusText: 'Forbidden', headers: {},
    })
  }
  await assert.rejects(login('owner', 'password'), (error) => error.code === 'PINGCHA_REQUIRED' && error.status === 403)
  assert.equal(getAuthSession(), null)
})

test('불완전한 로그인 응답은 인증 상태로 저장하지 않는다', async () => {
  apiClient.defaults.adapter = async (config) => response(config, owner)
  await assert.rejects(login('owner', 'password'))
  assert.equal(getAuthSession(), null)
})

test('문자열이 아닌 access token은 로그인 세션으로 저장하지 않는다', async () => {
  apiClient.defaults.adapter = async (config) => response(config, { ...owner, accessToken: 123 })
  await assert.rejects(login('owner', 'password'))
  assert.equal(getAuthSession(), null)
})

test('PDF 요청은 Bearer·입력 조건·취소 신호·PDF 응답 형식을 전달한다', async () => {
  saveAuthSession(session())
  const signal = new AbortController().signal
  const pdf = new Blob(['%PDF-test'], { type: 'application/pdf' })
  const request = { region: '서울', category: '카페', targetCustomerGroup: '20대', operatingHours: '09~18', email: owner.email, privacyConsent: true }
  apiClient.defaults.adapter = async (config) => {
    assert.equal(config.url, '/analysis/reports/location')
    assert.equal(config.headers.get('Authorization'), 'Bearer old-token')
    assert.equal(config.headers.get('Accept'), 'application/pdf')
    assert.equal(config.responseType, 'blob')
    assert.equal(config.signal, signal)
    assert.deepEqual(JSON.parse(config.data), request)
    return response(config, pdf, { 'content-disposition': 'attachment; filename="report.pdf"' })
  }
  const result = await requestLocationAnalysisReport(request, signal)
  assert.equal(result.pdf, pdf)
  assert.equal(result.filename, 'report.pdf')
})

test('PDF의 JSON Blob 오류에서 서버 코드를 보존하고 AI 연결 실패를 안내한다', async () => {
  saveAuthSession(session())
  let calls = 0
  apiClient.defaults.adapter = async (config) => {
    calls++
    throw new AxiosError('Bad Gateway', 'ERR_BAD_RESPONSE', config, {}, {
      config, status: 502, statusText: 'Bad Gateway', headers: {},
      data: new Blob([JSON.stringify({ code: 'AI_SERVICE_UNAVAILABLE', message: 'upstream detail' })],
        { type: 'application/json; charset=utf-8' }),
    })
  }
  await assert.rejects(apiClient.post('/analysis/reports/location', {}, { responseType: 'blob' }), (error) => {
    assert.equal(error.status, 502)
    assert.equal(error.code, 'AI_SERVICE_UNAVAILABLE')
    assert.match(locationAnalysisReportErrorMessage(error), /AI 분석 서비스 연결/)
    assert.equal(error.message.includes('upstream detail'), false)
    return true
  })
  assert.equal(calls, 1)
  assert.ok(getAuthSession())
})

test('프록시 HTML과 손상되거나 너무 큰 JSON 오류도 원래 HTTP 상태를 유지한다', async () => {
  for (const body of [
    new Blob(['<html>Bad Gateway</html>'], { type: 'text/html' }),
    new Blob(['{broken'], { type: 'application/json' }),
    new Blob([JSON.stringify({ code: 'AI_SERVICE_UNAVAILABLE', extra: 'x'.repeat(16_384) })], { type: 'application/json' }),
  ]) {
    apiClient.defaults.adapter = async (config) => {
      throw new AxiosError('Bad Gateway', 'ERR_BAD_RESPONSE', config, {}, {
        config, data: body, status: 502, statusText: 'Bad Gateway', headers: {},
      })
    }
    await assert.rejects(apiClient.get('/reports', { responseType: 'blob' }), (error) => {
      assert.equal(error.status, 502)
      assert.equal(error.code, undefined)
      assert.match(locationAnalysisReportErrorMessage(error), /분석 서버/)
      return true
    })
  }
})

test('PDF 오류 안내는 데이터 서비스·AI 응답 오류와 권한·호출 한도·시간 초과를 구분한다', () => {
  assert.match(locationAnalysisReportErrorMessage({ kind: 'http', status: 502, code: 'MCP_SERVICE_UNAVAILABLE' }), /데이터 서비스/)
  assert.match(locationAnalysisReportErrorMessage({ kind: 'http', status: 502, code: 'AI_RESPONSE_INVALID' }), /AI 분석 결과/)
  assert.match(locationAnalysisReportErrorMessage({ kind: 'http', status: 403 }), /접근 권한/)
  assert.match(locationAnalysisReportErrorMessage({ kind: 'http', status: 429 }), /한도/)
  assert.match(locationAnalysisReportErrorMessage({ kind: 'timeout' }), /생성 시간이 초과/)
})

test('동시 401은 refresh 한 번을 공유하고 각각 새 토큰으로 한 번만 재시도한다', async () => {
  saveAuthSession(session())
  const bothFailed = deferred()
  const refreshStarted = deferred()
  const refreshDone = deferred()
  let failures = 0
  let refreshCalls = 0
  let retries = 0
  apiClient.defaults.adapter = async (config) => {
    if (config.url === '/auth/token/refresh') {
      refreshCalls++
      assert.equal(config.headers.get('Authorization'), undefined)
      assert.equal(config.withCredentials, true)
      refreshStarted.resolve()
      await refreshDone.promise
      return response(config, { accessToken: 'renewed' })
    }
    if (config.headers.get('Authorization') === 'Bearer old-token') {
      if (++failures === 2) bothFailed.resolve()
      return rejectHttp(config, 401)
    }
    assert.equal(config.headers.get('Authorization'), 'Bearer renewed')
    retries++
    return response(config)
  }
  const requests = Promise.all([apiClient.get('/reports/1'), apiClient.get('/reports/2')])
  await bothFailed.promise
  await refreshStarted.promise
  refreshDone.resolve()
  await requests
  assert.equal(refreshCalls, 1)
  assert.equal(retries, 2)
  assert.equal(getAuthSession().accessToken, 'renewed')
})

test('새 토큰도 401이면 무한 재시도 없이 로그인을 종료한다', async () => {
  saveAuthSession(session())
  let calls = 0
  apiClient.defaults.adapter = async (config) => {
    calls++
    return config.url === '/auth/token/refresh'
      ? response(config, { accessToken: 'renewed' }) : rejectHttp(config, 401)
  }
  await assert.rejects(apiClient.get('/reports'), (error) => error.status === 401)
  assert.equal(calls, 3)
  assert.equal(getAuthSession(), null)
})

test('refresh 401은 세션을 종료하고 원래 보고서 요청을 반복하지 않는다', async () => {
  saveAuthSession(session())
  let calls = 0
  apiClient.defaults.adapter = (config) => { calls++; return rejectHttp(config, 401) }
  await assert.rejects(apiClient.get('/reports'), (error) => error.status === 401)
  assert.equal(calls, 2)
  assert.equal(getAuthSession(), null)
})

test('refresh 서버 장애는 인증 실패와 구별하고 기존 세션을 보존한다', async () => {
  saveAuthSession(session())
  apiClient.defaults.adapter = (config) => rejectHttp(config, config.url.startsWith('/auth/') ? 503 : 401)
  await assert.rejects(apiClient.get('/reports'), (error) => error.status === 503)
  assert.equal(getAuthSession().accessToken, 'old-token')
})

test('403 권한 거부는 토큰 갱신으로 우회하지 않는다', async () => {
  saveAuthSession(session())
  let calls = 0
  apiClient.defaults.adapter = (config) => { calls++; return rejectHttp(config, 403) }
  await assert.rejects(apiClient.get('/reports'), (error) => error.status === 403)
  assert.equal(calls, 1)
  assert.ok(getAuthSession())
})

test('취소한 PDF 요청에는 토큰 갱신이나 재시도를 하지 않는다', async () => {
  saveAuthSession(session())
  const controller = new AbortController()
  let calls = 0
  apiClient.defaults.adapter = (config) => { calls++; controller.abort(); return rejectHttp(config, 401) }
  await assert.rejects(apiClient.get('/reports', { signal: controller.signal }), (error) => error.kind === 'canceled')
  assert.equal(calls, 1)
})

test('갱신 중 로그아웃하면 세션이 되살아나지 않고 갱신 응답 뒤 서버 로그아웃을 보낸다', async () => {
  saveAuthSession(session())
  const started = deferred()
  const done = deferred()
  const calls = []
  apiClient.defaults.adapter = async (config) => {
    calls.push(config.url)
    if (config.url === '/auth/token/refresh') {
      started.resolve(); await done.promise
      return response(config, { accessToken: 'renewed' })
    }
    return config.url === '/auth/logout' ? response(config) : rejectHttp(config, 401)
  }
  const report = assert.rejects(apiClient.get('/reports'))
  await started.promise
  const loggingOut = logout()
  assert.equal(getAuthSession(), null)
  assert.equal(calls.includes('/auth/logout'), false)
  done.resolve()
  await Promise.all([report, loggingOut])
  assert.equal(getAuthSession(), null)
  assert.deepEqual(calls, ['/reports', '/auth/token/refresh', '/auth/logout'])
})

test('이전 계정의 늦은 401을 새 계정으로 재전송하지 않는다', async () => {
  saveAuthSession(session())
  const started = deferred()
  const done = deferred()
  let calls = 0
  apiClient.defaults.adapter = async (config) => {
    calls++; started.resolve(); await done.promise
    return rejectHttp(config, 401)
  }
  const report = assert.rejects(apiClient.get('/reports'), (error) => error.status === 401)
  await started.promise
  saveAuthSession(session('other-token', { ...owner, id: 2 }))
  done.resolve()
  await report
  assert.equal(calls, 1)
  assert.equal(getAuthSession().user.id, 2)
})

test('같은 계정으로 다시 로그인해도 이전 세션의 401은 재전송하지 않는다', async () => {
  saveAuthSession(session())
  const started = deferred()
  const done = deferred()
  let calls = 0
  apiClient.defaults.adapter = async (config) => {
    calls++; started.resolve(); await done.promise
    return rejectHttp(config, 401)
  }
  const report = assert.rejects(apiClient.get('/reports'), (error) => error.status === 401)
  await started.promise
  saveAuthSession(null)
  saveAuthSession(session('new-login', { ...owner }))
  done.resolve()
  await report
  assert.equal(calls, 1)
  assert.equal(getAuthSession().accessToken, 'new-login')
})

test('서버 로그아웃 응답이 새 로그인 쿠키를 덮지 않도록 순서를 보장한다', async () => {
  saveAuthSession(session())
  const started = deferred()
  const done = deferred()
  const calls = []
  apiClient.defaults.adapter = async (config) => {
    calls.push(config.url)
    if (config.url === '/auth/logout') { started.resolve(); await done.promise; return response(config) }
    return response(config, { ...owner, accessToken: 'new-login' })
  }
  const loggingOut = logout()
  await started.promise
  const loggingIn = login('owner', 'password')
  assert.deepEqual(calls, ['/auth/logout'])
  done.resolve()
  await Promise.all([loggingOut, loggingIn])
  assert.deepEqual(calls, ['/auth/logout', '/auth/login'])
  assert.equal(getAuthSession().accessToken, 'new-login')
})
