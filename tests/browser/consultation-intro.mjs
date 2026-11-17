import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { chromium } from 'playwright'

const output = await mkdtemp(join(tmpdir(), 'consultation-intro-71-'))
const fallback = '말씀해주신 가게를 준비하고 계시는군요. 정확한 분석을 위해 아래 카테고리 중 가장 가까운 업종을 선택해 주세요.'
const server = await createServer({ configFile: false, envDir: false, cacheDir: join(output, 'cache'), plugins: [react(), {
  name: 'intro-fixture', enforce: 'pre',
  resolveId(source) { if (/\/location\/naver(MapLoader|LocationSearch)$/.test(source)) return resolve('tests/browser/location-fixture.js') },
  configureServer(vite) {
    vite.middlewares.use(async (req, res, next) => {
      const path = req.url.split('?')[0]
      if (!['/intro-qa', '/', '/login'].includes(path)) return next()
      res.setHeader('Content-Type', 'text/html')
      const html = (await readFile('index.html', 'utf8'))
        .replace(/<link\b[^>]*href="https:\/\/cdn\.jsdelivr\.net[^"]*"[^>]*>/g, '')
        .replace('/src/main.tsx', path === '/intro-qa' ? '/tests/browser/consultation-intro-fixture.jsx' : '/tests/browser/consultation-fixture.jsx')
      res.end(await vite.transformIndexHtml(req.url, html))
    })
  },
}], server: { host: '127.0.0.1', port: 18474, strictPort: false } })
let browser
try {
  await server.listen(); browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  const base = `http://127.0.0.1:${server.httpServer.address().port}`
  const errors = [], blocked = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.origin === base && !url.pathname.startsWith('/api')) return route.continue()
    blocked.push(route.request().url()); return route.abort()
  })
  const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  const action = async (name, ...args) => {
    await page.evaluate(({ name, args }) => window.introQa.actions[name](...args), { name, args })
    await settle()
  }
  const snapshot = () => page.evaluate(() => ({ ...window.introQa.state, requests: window.introQa.requests.map(item => ({ message: item.message, aborted: item.signal.aborted })) }))
  const complete = async (index, value, failure = false, source = 'gemini') => {
    const before = await page.evaluate(() => window.introQa.completions)
    await page.evaluate(({ index, value, failure, source }) => {
      const request = window.introQa.requests[index]
      if (failure) request.reject(); else request.resolve(value, source)
    }, { index, value, failure, source })
    await page.waitForFunction(before => window.introQa.completions > before, before)
    await settle()
  }
  const waitRequests = count => page.waitForFunction(count => window.introQa.requests.length === count, count)
  const load = async (query = '') => { await page.goto(`${base}/intro-qa${query}`); await page.waitForFunction(() => Boolean(window.introQa?.actions)); await settle() }
  await load()
  assert.deepEqual((await snapshot()).requests, [])
  await action('render')
  assert.deepEqual((await snapshot()).requests, [])
  console.log('PASS empty prompt and unrelated render do not request')

  await action('submit', '합성 카페')
  await waitRequests(1)
  assert.equal((await snapshot()).requests[0].message, '합성 카페')
  await action('render')
  assert.equal((await snapshot()).requests.length, 1)
  await complete(0, '  합성 AI 안내  ')
  assert.equal((await snapshot()).assistantMessage, '합성 AI 안내')
  assert.equal((await snapshot()).requests[0].aborted, true)
  await action('render')
  assert.equal((await snapshot()).requests.length, 1)
  console.log('PASS exact prompt payload, stable setter, trimmed success and completed effect cleanup')

  await action('restore', '저장 질문', '저장 안내')
  assert.equal((await snapshot()).assistantMessage, '저장 안내')
  assert.equal((await snapshot()).requests.length, 1)
  await action('restore', '미완료 저장 질문', null)
  await waitRequests(2)
  await complete(1, '복원된 안내', false, 'fallback')
  assert.equal((await snapshot()).assistantMessage, '복원된 안내')
  console.log('PASS restored message skips request; pending restored prompt uses server fallback response')

  await action('submit', '이전 질문')
  await waitRequests(3)
  await action('submit', '현재 질문')
  await waitRequests(4)
  assert.equal((await snapshot()).requests[2].aborted, true)
  await complete(3, '현재 안내')
  await complete(2, '늦은 이전 안내')
  assert.equal((await snapshot()).assistantMessage, '현재 안내')
  console.log('PASS prompt replacement aborts previous request and ignores late success')

  await action('submit', '복원 전 질문')
  await waitRequests(5)
  await action('restore', '다른 저장 질문', '다른 저장 안내')
  assert.equal((await snapshot()).requests[4].aborted, true)
  await complete(4, null, true)
  assert.equal((await snapshot()).assistantMessage, '다른 저장 안내')
  console.log('PASS session restore aborts pending request; late failure cannot overwrite saved message')

  for (const failure of [false, true]) {
    const index = (await snapshot()).requests.length
    await action('submit', `초기화 전 ${failure}`)
    await waitRequests(index + 1)
    await action('reset')
    assert.equal((await snapshot()).requests[index].aborted, true)
    await complete(index, '늦은 안내', failure)
    assert.equal((await snapshot()).assistantMessage, null)
    assert.equal((await snapshot()).submittedPrompt, null)
  }
  console.log('PASS reset/new-session cancellation suppresses late success and failure fallback')

  for (const [value, failure] of [[null, true], ['', false], ['   ', false], [null, false]]) {
    const index = (await snapshot()).requests.length
    await action('submit', `실패 합성 ${index}`)
    await waitRequests(index + 1)
    await complete(index, value, failure)
    assert.equal((await snapshot()).assistantMessage, fallback)
    assert.equal((await snapshot()).requests.length, index + 1, 'no automatic retry')
  }
  console.log('PASS HTTP failure, empty/whitespace/missing message keep original fallback without retry')

  let index = (await snapshot()).requests.length
  await action('submit', '직접 취소')
  await waitRequests(index + 1)
  await action('cancel')
  await action('cancel')
  await complete(index, '취소 후 안내')
  assert.equal((await snapshot()).assistantMessage, null)
  await action('render')
  assert.equal((await snapshot()).requests.length, index + 1)
  console.log('PASS explicit/logout cancellation is idempotent and does not retry unchanged prompt')

  index = (await snapshot()).requests.length
  await action('submit', '이전 계정')
  await waitRequests(index + 1)
  await action('switchAccount', 902)
  assert.equal((await snapshot()).userId, 902)
  assert.equal((await snapshot()).assistantMessage, null)
  assert.equal((await snapshot()).requests[index].aborted, true)
  await action('submit', '현재 계정')
  await waitRequests(index + 2)
  await complete(index + 1, '현재 계정 안내')
  await complete(index, '이전 계정 안내')
  assert.equal((await snapshot()).assistantMessage, '현재 계정 안내')
  console.log('PASS account-keyed remount aborts old request and isolates late account response')

  await load('?prompt=StrictMode')
  // Axios rejects the replay's canceled config before dispatching its adapter.
  // Check both effect lifetimes, not an assumed duplicate transport request.
  await waitRequests(1)
  assert.deepEqual(await page.evaluate(() => window.introQa.controllers.map(item => item.signal.aborted)), [true, false])
  assert.deepEqual((await snapshot()).requests.map(item => item.aborted), [false])
  await complete(0, 'Strict 현재 응답')
  assert.equal((await snapshot()).assistantMessage, 'Strict 현재 응답')
  console.log('PASS StrictMode mount replay cleans up first request without suppressing current response')

  await action('submit', '빠른 A')
  await waitRequests(2)
  await action('submit', '빠른 B')
  await waitRequests(3)
  await action('submit', '빠른 C')
  await waitRequests(4)
  assert.deepEqual((await snapshot()).requests.slice(1).map(item => item.aborted), [true, true, false])
  await complete(2, '늦은 B')
  await complete(1, null, true)
  assert.equal((await snapshot()).assistantMessage, null)
  await complete(3, '현재 C')
  assert.equal((await snapshot()).assistantMessage, '현재 C')
  console.log('PASS rapid request replacement keeps only latest response')

  await action('submit', '언마운트 전 질문')
  await waitRequests(5)
  await action('unmount')
  assert.equal((await snapshot()).requests[4].aborted, true)
  await complete(4, null, true)
  assert.equal(await page.getByRole('status').textContent(), 'Unmounted')
  assert.deepEqual(await page.evaluate(() => window.introQa.unexpected), [])
  assert.deepEqual(errors, [])
  assert.deepEqual(blocked, [])
  console.log('PASS unmount abort, no page errors and no external/business network')
  await context.close()

  // Verify the real page's reset/restore/logout wiring as well as the hook.
  const appContext = await browser.newContext({ viewport: { width: 1366, height: 768 } })
  const app = await appContext.newPage()
  app.setDefaultTimeout(10000)
  const appErrors = [], appBlocked = []
  app.on('pageerror', error => appErrors.push(error.message))
  await app.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.origin === base && !url.pathname.startsWith('/api')) return route.continue()
    appBlocked.push(url.origin + url.pathname); return route.abort()
  })
  const legacy = JSON.parse(await readFile(new URL('../fixtures/consultation-history-v1.json', import.meta.url), 'utf8'))
  const saved = legacy.sessions[0]
  await app.addInitScript(seed => {
    if (!localStorage.getItem('pingdom-ai-consultation-history-v1:901')) localStorage.setItem('pingdom-ai-consultation-history-v1:901', JSON.stringify(seed))
  }, legacy)
  await app.clock.install()
  const advance = () => app.clock.runFor(60000)
  const stored = (id = 901) => app.evaluate(id => JSON.parse(localStorage.getItem(`pingdom-ai-consultation-history-v1:${id}`)), id)
  const submit = async (prompt, count) => {
    const input = app.getByRole('textbox', { name: 'AI 질문 입력' })
    await input.fill(prompt); await input.press('Enter')
    await app.clock.runFor(1000)
    await app.waitForFunction(count => window.qa.introRequests.length === count, count)
  }
  const finish = async (index, failure = false) => {
    const before = await app.evaluate(() => window.qa.introCompletions)
    await app.evaluate(({ index, failure }) => {
      const request = window.qa.introRequests[index]
      if (failure) request.reject(); else request.resolve('현재 페이지 합성 안내')
    }, { index, failure })
    await app.waitForFunction(before => window.qa.introCompletions > before, before)
    await advance()
  }
  const aborted = index => app.evaluate(index => window.qa.introRequests[index].signal.aborted, index)
  await app.goto(base)
  await app.evaluate(() => { window.qa.introMode = 'hold' })
  await submit('초기화 전 합성 질문', 1)
  await app.getByRole('button', { name: '새 상담', exact: true }).click()
  assert.equal(await aborted(0), true)
  await finish(0)
  assert.equal((await stored()).activeSessionId, null)
  assert.equal((await stored()).sessions.find(item => item.submittedPrompt === '초기화 전 합성 질문').assistantMessage, null)
  await submit('현재 합성 질문', 2)
  await finish(1)
  assert.equal((await stored()).sessions.find(item => item.submittedPrompt === '현재 합성 질문').assistantMessage, '현재 페이지 합성 안내')
  console.log('PASS actual page: new consultation aborts old intro; late result cannot update history; current response persists')

  await app.getByRole('button', { name: '새 상담', exact: true }).click()
  await submit('복원 전 합성 질문', 3)
  await app.getByRole('button', { name: saved.title, exact: true }).click()
  assert.equal(await aborted(2), true)
  await finish(2, true)
  const restored = await stored()
  assert.equal(restored.activeSessionId, saved.id)
  assert.equal(restored.sessions.find(item => item.id === saved.id).assistantMessage, saved.assistantMessage)
  assert.equal(await app.evaluate(() => window.qa.introRequests.length), 3)
  console.log('PASS actual page: selecting saved consultation aborts pending intro and preserves saved message without re-request')

  await app.getByRole('button', { name: '새 상담', exact: true }).click()
  await submit('로그아웃 전 합성 질문', 4)
  await app.getByRole('button', { name: '로그아웃', exact: true }).first().click()
  await app.waitForURL('**/login')
  assert.equal(await aborted(3), true)
  await finish(3)
  assert.equal((await stored()).sessions.find(item => item.submittedPrompt === '로그아웃 전 합성 질문').assistantMessage, null)
  console.log('PASS actual page: logout aborts pending intro and prevents late history writes')

  await app.goto(base)
  await app.evaluate(() => { window.qa.introMode = 'hold' })
  await submit('계정 전환 전 합성 질문', 1)
  await app.evaluate(() => window.qa.account(902))
  await app.getByRole('textbox', { name: 'AI 질문 입력' }).waitFor()
  assert.equal(await aborted(0), true)
  await finish(0)
  assert.ok(!(await stored(902))?.sessions.some(item => item.submittedPrompt === '계정 전환 전 합성 질문'))
  assert.equal((await stored()).sessions.find(item => item.submittedPrompt === '계정 전환 전 합성 질문').assistantMessage, null)
  assert.equal(await app.evaluate(() => window.qa.requests.filter(item => item.url === '/analysis/reports/location').length), 0)
  assert.deepEqual(await app.evaluate(() => window.qa.unexpected), [])
  assert.deepEqual(appErrors, [])
  assert.deepEqual(appBlocked, [])
  await appContext.close()
  console.log('PASS actual page: account switch aborts old intro with no cross-account history or paid analysis')
  console.log(`Artifacts: ${output}; actual hook/API, synthetic transport; no real users, AI or report billing.`)
} finally {
  await browser?.close()
  await server.close()
}
