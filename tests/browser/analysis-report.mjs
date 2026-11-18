import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { chromium } from 'playwright'

const output = await mkdtemp(join(tmpdir(), 'analysis-report-71-'))
const server = await createServer({ configFile: false, envDir: false, cacheDir: join(output, 'cache'), plugins: [react(), {
  name: 'report-fixture',
  configureServer(vite) {
    vite.middlewares.use(async (req, res, next) => {
      if (req.url.split('?')[0] !== '/report-qa') return next()
      res.setHeader('Content-Type', 'text/html')
      const html = (await readFile('index.html', 'utf8')).replace(/<link\b[^>]*href="https:\/\/cdn\.jsdelivr\.net[^"]*"[^>]*>/g, '').replace('/src/main.tsx', '/tests/browser/analysis-report-fixture.jsx')
      res.end(await vite.transformIndexHtml(req.url, html))
    })
  },
}], server: { host: '127.0.0.1', port: 18475, strictPort: false } })
let browser
try {
  await server.listen(); browser = await chromium.launch()
  const context = await browser.newContext(), page = await context.newPage()
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
    const result = await page.evaluate(({ name, args }) => window.reportQa.actions[name](...args), { name, args })
    await settle(); return result
  }
  const state = () => page.evaluate(() => window.reportQa.state)
  const requests = count => page.waitForFunction(count => window.reportQa.requests.length === count, count)
  const complete = async (index, method, ...args) => {
    const before = await page.evaluate(() => window.reportQa.completions)
    await page.evaluate(({ index, method, args }) => window.reportQa.requests[index][method](...args), { index, method, args })
    await page.waitForFunction(before => window.reportQa.completions > before, before); await settle()
  }
  const load = async () => { await page.goto(`${base}/report-qa`); await page.waitForFunction(() => Boolean(window.reportQa?.actions)); await settle() }
  await load()
  assert.equal((await state()).filename, null)
  assert.equal(await page.evaluate(() => window.reportQa.requests.length), 0)
  await action('download')
  assert.equal(await page.evaluate(() => window.reportQa.downloads.length), 0)
  console.log('PASS idle StrictMode mount and empty download do not request or download')

  await action('submit'); await requests(1)
  assert.equal((await state()).submitting, true)
  assert.equal((await state()).confirmed, true)
  assert.equal((await state()).stage, 'initial-loading')
  assert.deepEqual(await page.evaluate(() => {
    const r = window.reportQa.requests[0]
    return { payload: r.payload, timeout: r.config.timeout, type: r.config.responseType, accept: r.config.headers.Accept }
  }), { payload: { region: '합성 지역', category: '카페', targetCustomerGroup: '20대', operatingHours: '평일 09:00~18:00', email: 'synthetic-901@example.invalid', privacyConsent: true }, timeout: 125000, type: 'blob', accept: 'application/pdf' })
  await page.waitForFunction(() => window.reportQa.state.stage === 'message')
  await action('finishTypewriter')
  await page.waitForFunction(() => window.reportQa.state.stage === 'analysis-loading')
  await complete(0, 'resolve', 'first.pdf')
  assert.equal((await state()).filename, 'first.pdf')
  assert.equal((await state()).submitting, false)
  await page.waitForFunction(async () => (await window.reportQa.actions.stored(901, 'session-a')) === 'first.pdf')
  await action('download')
  assert.deepEqual(await page.evaluate(() => ({ downloads: window.reportQa.downloads.map(d => ({ filename: d.filename, attached: d.attached })), revoked: window.reportQa.revoked[0] === window.reportQa.downloads[0].href })), { downloads: [{ filename: 'first.pdf', attached: true }], revoked: true })
  console.log('PASS original payload, timeout, progress stages, IndexedDB save and blob URL cleanup')

  await action('select', 'session-b'); await action('select', 'session-a')
  await page.waitForFunction(() => window.reportQa.state.filename === 'first.pdf')
  await action('switchAccount', 902)
  await page.waitForFunction(() => window.reportQa.state.userId === 902)
  assert.equal((await state()).filename, null)
  assert.equal(await action('stored', 901, 'session-a'), 'first.pdf')
  await action('seed', 902, 'session-b', 'account-b.pdf')
  await action('select', 'session-b')
  await page.waitForFunction(() => window.reportQa.state.filename === 'account-b.pdf')
  await action('delete', 'session-b')
  await page.waitForFunction(async () => !(await window.reportQa.actions.stored(902, 'session-b')))
  assert.equal(await action('stored', 901, 'session-a'), 'first.pdf')
  console.log('PASS restore, account/session key isolation and deletion of only the intended PDF')

  await load()
  await action('submit'); await requests(1)
  await complete(0, 'reject', 502)
  assert.match((await state()).error, /분석 서버/)
  assert.equal((await state()).confirmed, false)
  assert.equal((await state()).stage, null)
  await action('clearError'); assert.equal((await state()).error, null)
  await action('submit'); await requests(2)
  await complete(1, 'timeout')
  assert.match((await state()).error, /시간이 초과/)
  await action('submit'); await requests(3)
  await complete(2, 'resolve', null)
  assert.equal((await state()).filename, 'location-analysis-report.pdf')
  assert.equal((await state()).error, null)
  console.log('PASS failure clears confirmation, error reset, timeout, manual retry and default filename')

  await load()
  await action('submit'); await requests(1)
  await action('submit'); await requests(2)
  assert.equal(await page.evaluate(() => window.reportQa.requests[0].signal.aborted), true)
  await complete(0, 'resolve', 'stale.pdf')
  assert.equal((await state()).submitting, true)
  assert.equal((await state()).filename, null)
  await complete(1, 'resolve', 'current.pdf')
  assert.equal((await state()).filename, 'current.pdf')
  await action('submit'); await requests(3)
  await action('reset')
  await complete(2, 'reject', 403)
  assert.equal((await state()).error, null)
  assert.equal((await state()).filename, null)
  await page.waitForTimeout(1600)
  assert.equal((await state()).stage, null)
  console.log('PASS replacement request survives stale finally; reset rejects late errors and clears initial timer')

  await load()
  await action('submit'); await requests(1)
  await action('cancel')
  assert.equal(await page.evaluate(() => window.reportQa.requests[0].signal.aborted), true)
  assert.equal((await state()).confirmed, true)
  await complete(0, 'resolve', 'cancelled.pdf')
  assert.equal((await state()).filename, null)
  assert.equal((await state()).error, null)
  assert.equal((await state()).submitting, false)
  await action('unmount')
  console.log('PASS logout-style cancel only aborts the request; no synthetic success or error is applied')

  await load()
  await action('submit'); await requests(1)
  await page.waitForFunction(() => window.reportQa.state.stage === 'message')
  await action('finishTypewriter'); await action('select', 'new-session')
  await complete(0, 'resolve', 'old-session.pdf')
  await page.waitForTimeout(500)
  assert.equal((await state()).stage, null)
  assert.equal((await state()).filename, null)
  assert.equal(await action('stored', 901, 'new-session'), null)
  console.log('PASS session switch clears message-gap timer and ignores late PDF')

  await load()
  await action('seed', 901, 'delayed-old', 'delayed-old.pdf')
  await page.evaluate(() => { window.reportQa.deferReads = true })
  await action('select', 'delayed-old')
  await page.waitForFunction(() => window.reportQa.reads.length === 1)
  await action('select', 'delayed-new')
  await page.waitForFunction(() => window.reportQa.reads.length === 2)
  await page.evaluate(() => { window.reportQa.deferReads = false; window.reportQa.reads.pop()(); window.reportQa.reads.pop()() })
  await settle(); assert.equal((await state()).filename, null)
  console.log('PASS late IndexedDB restoration is ignored after session change')

  await action('submit'); await requests(1)
  await action('switchAccount', 902)
  await page.waitForFunction(() => window.reportQa.state.userId === 902)
  assert.equal(await page.evaluate(() => window.reportQa.requests[0].signal.aborted), true)
  await complete(0, 'resolve', 'old-account.pdf')
  assert.equal((await state()).filename, null)
  await action('submit'); await requests(2)
  await action('unmount')
  assert.equal(await page.evaluate(() => window.reportQa.requests[1].signal.aborted), true)
  await complete(1, 'resolve', 'unmounted.pdf')
  console.log('PASS account remount and unmount abort requests; no late completion is applied')

  await load()
  await page.evaluate(() => { window.reportQa.blockStorage = true })
  await action('select', 'blocked')
  await action('submit'); await requests(1)
  await complete(0, 'resolve', 'memory-only.pdf')
  assert.equal((await state()).filename, 'memory-only.pdf')
  assert.equal((await state()).error, null)
  await action('download')
  assert.equal(await page.evaluate(() => window.reportQa.downloads[0].filename), 'memory-only.pdf')
  await action('delete', 'blocked')
  assert.deepEqual(await page.evaluate(() => window.reportQa.unexpected), [])
  assert.deepEqual(blocked, []); assert.deepEqual(errors, [])
  console.log('PASS unavailable storage keeps in-memory PDF downloadable; no real API or uncaught browser error')
  console.log('PASS 10 report lifecycle groups (synthetic only)')
} finally { await browser?.close(); await server.close() }
