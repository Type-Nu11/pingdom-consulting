import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { chromium } from 'playwright'

const output = await mkdtemp(join(tmpdir(), 'consultation-history-71-'))
const fixture = JSON.parse(await readFile(new URL('../fixtures/consultation-history-v1.json', import.meta.url), 'utf8'))
const first = fixture.sessions[0]
const second = { ...first, id: 'legacy-second', title: '두 번째 합성 상담', isPinned: false, updatedAt: first.updatedAt + 1000 }
const seed = { activeSessionId: first.id, sessions: [first, second] }
const server = await createServer({ configFile: false, envDir: false, cacheDir: join(output, 'cache'), plugins: [react(), {
  name: 'history-fixture', configureServer(vite) {
    vite.middlewares.use(async (req, res, next) => {
      if (req.url !== '/history-qa') return next()
      res.setHeader('Content-Type', 'text/html')
      res.end(await vite.transformIndexHtml(req.url, (await readFile('index.html', 'utf8')).replace('/src/main.tsx', '/tests/browser/consultation-history-fixture.jsx')))
    })
  },
}], server: { host: '127.0.0.1', port: 18472, strictPort: false } })
let browser
try {
  await server.listen(); browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const base = `http://127.0.0.1:${server.httpServer.address().port}`
  await page.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort())
  await page.addInitScript(seed => localStorage.setItem('pingdom-ai-consultation-history-v1:901', JSON.stringify(seed)), seed)
  const action = (name, ...args) => page.evaluate(({ name, args }) => window.historyQa.actions[name](...args), { name, args })
  const snapshot = () => page.evaluate(() => ({ ...window.historyQa, actions: undefined }))
  const stored = (id = 901) => page.evaluate(id => JSON.parse(localStorage.getItem(`pingdom-ai-consultation-history-v1:${id}`)), id)
  const wait = predicate => page.waitForFunction(predicate)
  await page.goto(`${base}/history-qa`)
  await wait(() => window.historyQa?.sessions.length === 2)
  assert.equal((await snapshot()).active, null)
  assert.deepEqual((await stored()).sessions, seed.sessions, 'startup preserves history without auto-selecting it')
  console.log('PASS initial history and no automatic selection')

  await action('select', first.id)
  await wait(() => window.historyQa.active === 'legacy-cafe' && window.historyQa.draft.confirmedCategory === 'CAFE')
  await wait(() => JSON.parse(localStorage.getItem('pingdom-ai-consultation-history-v1:901')).activeSessionId === 'legacy-cafe')
  const selected = (await stored()).sessions.find(session => session.id === first.id)
  await action('rename', first.id); await wait(() => window.historyQa.editing === 'legacy-cafe')
  await action('setTitle', '  '); await wait(() => window.historyQa.title === '  ')
  await action('submitRename'); assert.equal((await snapshot()).editing, first.id)
  await action('setTitle', '  이름 수정  '); await wait(() => window.historyQa.title === '  이름 수정  ')
  await action('submitRename'); await wait(() => window.historyQa.editing === null)
  const renamed = (await stored()).sessions.find(session => session.id === first.id)
  assert.equal(renamed.title, '이름 수정')
  assert.equal(renamed.createdAt, selected.createdAt)
  assert.equal(renamed.updatedAt, selected.updatedAt)
  await action('rename', first.id); await wait(() => window.historyQa.editing === 'legacy-cafe')
  await action('cancelRename'); await wait(() => window.historyQa.editing === null && window.historyQa.title === '')
  console.log('PASS rename validation, cancel, metadata and persistence')

  await page.evaluate(() => { window.historyQa.actions.pin('legacy-cafe'); window.historyQa.actions.pin('legacy-second') })
  await wait(() => window.historyQa.sessions[0].id === 'legacy-second')
  assert.equal((await stored()).sessions[0].isPinned, true)
  await action('toggleMenu', first.id); await wait(() => window.historyQa.menu === 'legacy-cafe')
  await action('toggleMenu', first.id); await wait(() => window.historyQa.menu === null)
  await action('changeDraft', { additionalDetails: '수정 중인 합성 내용' })
  await wait(() => JSON.parse(localStorage.getItem('pingdom-ai-consultation-history-v1:901')).sessions.find(item => item.id === 'legacy-cafe').additionalDetails === '수정 중인 합성 내용')
  const restoreCount = await page.evaluate(() => window.historyEvents.filter(item => item.kind === 'restore').length)
  await action('select', first.id)
  assert.equal(await page.evaluate(() => window.historyEvents.filter(item => item.kind === 'restore').length), restoreCount)
  assert.equal((await stored()).sessions.find(item => item.id === first.id).title, '이름 수정')
  console.log('PASS rapid pin actions, menu toggle, draft update and same-session no-op')

  await action('rename', second.id); await wait(() => window.historyQa.editing === 'legacy-second')
  await action('setTitle', '다른 상담 이름'); await wait(() => window.historyQa.title === '다른 상담 이름')
  await action('submitRename'); await wait(() => window.historyQa.editing === null)
  assert.equal((await stored()).sessions.find(item => item.id === second.id).title, '다른 상담 이름')
  assert.equal((await snapshot()).active, first.id)
  assert.equal((await snapshot()).draft.additionalDetails, '수정 중인 합성 내용')
  console.log('PASS nonactive rename preserves current consultation')

  await action('delete', second.id); await wait(() => window.historyQa.pendingDeletion === 'legacy-second')
  await action('cancelDelete'); await wait(() => window.historyQa.pendingDeletion === null)
  assert.equal(await page.evaluate(() => window.historyEvents.filter(item => item.kind === 'delete-report').length), 0)
  await action('delete', second.id); await wait(() => window.historyQa.pendingDeletion === 'legacy-second')
  await action('confirmDelete'); await wait(() => window.historyQa.sessions.length === 1)
  assert.equal((await snapshot()).active, first.id)
  assert.equal((await snapshot()).draft.additionalDetails, '수정 중인 합성 내용')
  assert.deepEqual(await page.evaluate(() => window.historyEvents.filter(item => item.kind === 'delete-report')), [{ kind: 'delete-report', userId: 901, id: second.id }])
  assert.equal(await page.evaluate(() => window.historyEvents.filter(item => item.kind === 'reset').length), 0)
  await action('confirmDelete')
  assert.equal(await page.evaluate(() => window.historyEvents.filter(item => item.kind === 'delete-report').length), 1)
  console.log('PASS nonactive deletion preserves current draft, cancel is nondestructive')

  await action('new'); await wait(() => window.historyQa.active === null && window.historyQa.draft.submittedPrompt === null)
  await page.evaluate(() => { window.historyQa.actions.begin(); window.historyQa.actions.changeDraft({ pendingPrompt: '새 합성 질문' }) })
  await wait(() => window.historyQa.sessions.length === 2 && window.historyQa.active !== null)
  const newId = (await snapshot()).active
  assert.notEqual(newId, first.id)
  assert.equal((await stored()).sessions.find(item => item.id === newId).title, '새 합성 질문')
  assert.equal((await stored()).sessions.find(item => item.id === newId).confirmedCategory, null)
  await action('select', first.id); await wait(() => window.historyQa.active === 'legacy-cafe')
  await action('select', newId); await wait(() => window.historyQa.draft.pendingPrompt === '새 합성 질문')
  await action('delete', newId); await wait(() => window.historyQa.pendingDeletion !== null)
  await action('confirmDelete'); await wait(() => window.historyQa.active === null && window.historyQa.sessions.length === 1)
  assert.equal((await snapshot()).draft.pendingPrompt, null)
  assert.equal((await stored()).activeSessionId, null)
  console.log('PASS new consultation, selection restoration and active deletion reset')

  const ownerHistory = await stored()
  await action('switchAccount', 902); await wait(() => window.historyQa.userId === 902)
  assert.equal((await snapshot()).sessions.length, 0)
  assert.equal((await snapshot()).active, null)
  assert.deepEqual(await stored(901), ownerHistory)
  await action('switchAccount', 901); await wait(() => window.historyQa.userId === 901)
  assert.equal((await snapshot()).sessions[0].title, '이름 수정')
  assert.equal((await snapshot()).active, null)
  assert.equal((await snapshot()).editing, null)
  assert.equal((await snapshot()).pendingDeletion, null)
  assert.deepEqual(errors, [])
  console.log('PASS account-keyed remount, stored isolation and transient state reset')
  await context.close()
  for (const mode of ['corrupt', 'read-denied', 'write-denied']) {
    const faultContext = await browser.newContext()
    const faultPage = await faultContext.newPage()
    faultPage.setDefaultTimeout(10000)
    const errors = []
    faultPage.on('pageerror', error => errors.push(error.message))
    await faultPage.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort())
    await faultPage.addInitScript(mode => {
      if (mode === 'corrupt') localStorage.setItem('pingdom-ai-consultation-history-v1:901', '{broken')
      if (mode === 'read-denied') {
        const original = Storage.prototype.getItem
        Storage.prototype.getItem = function (...args) { if (this === localStorage) throw new Error('Synthetic read denial'); return original.apply(this, args) }
      }
      if (mode === 'write-denied') {
        const original = Storage.prototype.setItem
        Storage.prototype.setItem = function (...args) { if (this === localStorage) throw new Error('Synthetic quota'); return original.apply(this, args) }
      }
    }, mode)
    await faultPage.goto(`${base}/history-qa`)
    await faultPage.waitForFunction(() => Boolean(window.historyQa))
    assert.equal(await faultPage.evaluate(() => window.historyQa.sessions.length), 0)
    await faultPage.evaluate(() => { window.historyQa.actions.begin(); window.historyQa.actions.changeDraft({ pendingPrompt: '저장소 장애 중 합성 질문' }) })
    await faultPage.waitForFunction(() => window.historyQa.sessions.length === 1)
    assert.equal(await faultPage.evaluate(() => window.historyQa.sessions[0].title), '저장소 장애 중 합성 질문')
    assert.deepEqual(errors, [])
    console.log(`PASS ${mode}: history remains usable in memory`)
    await faultContext.close()
  }
} finally { await browser?.close(); await server.close() }
