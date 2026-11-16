import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { chromium } from 'playwright'

const output = await mkdtemp(join(tmpdir(), 'consultation-flow-state-71-'))
const fixture = JSON.parse(await readFile(new URL('../fixtures/consultation-history-v1.json', import.meta.url), 'utf8'))
const saved = fixture.sessions[0]
const fields = [
  'selectedCategory', 'confirmedCategory', 'customCategory', 'confirmedCustomCategory',
  'confirmedLocation', 'confirmedTargetCustomer', 'confirmedOperatingHours',
  'additionalDetails', 'confirmedAdditionalDetails', 'isSummaryConfirmed',
]
const pick = value => Object.fromEntries(fields.map(field => [field, value[field]]))
const initial = {
  selectedCategory: null, confirmedCategory: null, customCategory: '', confirmedCustomCategory: '',
  confirmedLocation: null, confirmedTargetCustomer: null, confirmedOperatingHours: null,
  additionalDetails: '', confirmedAdditionalDetails: '', isSummaryConfirmed: false,
}
const server = await createServer({ configFile: false, envDir: false, cacheDir: join(output, 'cache'), plugins: [react(), {
  name: 'flow-state-fixture', configureServer(vite) {
    vite.middlewares.use(async (req, res, next) => {
      if (req.url !== '/flow-qa') return next()
      res.setHeader('Content-Type', 'text/html')
      // This state-only harness needs no webfont; keep the zero external-request
      // assertion strict instead of allowing network traffic for presentation.
      const html = (await readFile('index.html', 'utf8'))
        .replace(/<link\b[^>]*href="https:\/\/cdn\.jsdelivr\.net[^"]*"[^>]*>/g, '')
        .replace('/src/main.tsx', '/tests/browser/consultation-flow-state-fixture.jsx')
      res.end(await vite.transformIndexHtml(req.url, html))
    })
  },
}], server: { host: '127.0.0.1', port: 18473, strictPort: false } })
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
    if (new URL(route.request().url()).origin === base && !new URL(route.request().url()).pathname.startsWith('/api')) return route.continue()
    blocked.push(route.request().url()); return route.abort()
  })
  await page.addInitScript(seed => localStorage.setItem('pingdom-ai-consultation-history-v1:901', JSON.stringify(seed)), fixture)
  const snapshot = () => page.evaluate(() => ({ ...window.flowQa, actions: undefined }))
  const state = async () => (await snapshot()).state
  const action = async (name, ...args) => {
    await page.evaluate(({ name, args }) => window.flowQa.actions[name](...args), { name, args })
    // Synchronize with React's commit, not an arbitrary wall-clock delay.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  }
  const stored = (id = 901) => page.evaluate(id => JSON.parse(localStorage.getItem(`pingdom-ai-consultation-history-v1:${id}`)), id)
  await page.goto(`${base}/flow-qa`)
  await page.waitForFunction(() => window.flowQa?.sessions.length === 1)
  assert.deepEqual(await state(), initial)
  assert.equal((await snapshot()).active, null)
  await action('confirmCategory')
  assert.deepEqual(await state(), initial)
  await action('selectCategory', 'OTHER')
  await action('setCustomCategory', '   ')
  assert.equal((await snapshot()).canConfirmCategory, false)
  await action('confirmCategory')
  assert.equal((await state()).confirmedCategory, null)
  await action('setCustomCategory', '  합성 전문점  ')
  assert.equal((await snapshot()).canConfirmCategory, true)
  await action('confirmCategory')
  assert.equal((await state()).customCategory, '  합성 전문점  ')
  assert.equal((await state()).confirmedCustomCategory, '합성 전문점')
  assert.equal((await snapshot()).confirmedCategoryLabel, '합성 전문점')
  const locked = await state()
  await action('selectCategory', 'CAFE')
  assert.deepEqual(await state(), locked, 'a confirmed category cannot be reselected in the initial step')
  console.log('PASS initial state, blank OTHER guard, trim and confirmed category lock')

  const location = { ...saved.confirmedLocation, id: 'second-place', displayName: '다른 합성 장소' }
  const customer = { ageGroups: ['40대'], nationality: '외국인' }
  const hours = { operatingDays: '주말', startTime: '10:00', endTime: '20:00' }
  const scenarios = [
    ['confirmLocation', location, { confirmedLocation: location, confirmedTargetCustomer: null, confirmedOperatingHours: null, confirmedAdditionalDetails: '', isSummaryConfirmed: false }],
    ['changeSummaryLocation', location, { confirmedLocation: location, confirmedTargetCustomer: null, confirmedOperatingHours: null, isSummaryConfirmed: false }],
    ['confirmTargetCustomer', customer, { confirmedTargetCustomer: customer, confirmedOperatingHours: null, confirmedAdditionalDetails: '', isSummaryConfirmed: false }],
    ['editTargetCustomer', undefined, { confirmedTargetCustomer: null, confirmedOperatingHours: null, isSummaryConfirmed: false }],
    ['confirmOperatingHours', hours, { confirmedOperatingHours: hours, confirmedAdditionalDetails: '', isSummaryConfirmed: false }],
    ['editOperatingHours', undefined, { confirmedOperatingHours: null, isSummaryConfirmed: false }],
    ['changeSummaryCategory', '음식점', { selectedCategory: 'RESTAURANT', confirmedCategory: 'RESTAURANT', customCategory: '', confirmedCustomCategory: '', isSummaryConfirmed: false }],
    ['changeSummaryCategory', '  임의 합성 업종  ', { selectedCategory: 'OTHER', confirmedCategory: 'OTHER', customCategory: '  임의 합성 업종  ', confirmedCustomCategory: '  임의 합성 업종  ', isSummaryConfirmed: false }],
    ['clearSummaryConfirmation', undefined, { isSummaryConfirmed: false }],
  ]
  for (const [name, argument, changes] of scenarios) {
    await action('restoreFlow', saved)
    assert.deepEqual(await state(), pick(saved))
    await action(name, argument)
    assert.deepEqual(await state(), { ...pick(saved), ...changes }, name)
    console.log(`PASS ${name}: exact changed and preserved fields`)
  }
  await action('setAdditionalDetails', '  새 합성 추가 내용  ')
  await action('confirmSummary')
  assert.equal((await state()).additionalDetails, '  새 합성 추가 내용  ')
  assert.equal((await state()).confirmedAdditionalDetails, '새 합성 추가 내용')
  assert.equal((await state()).isSummaryConfirmed, true)
  await action('resetFlow')
  assert.deepEqual(await state(), initial)
  await action('selectCategory', 'CAFE')
  await action('confirmCategory')
  assert.equal((await snapshot()).confirmedCategoryLabel, '카페')
  assert.equal((await state()).confirmedCustomCategory, '')
  console.log('PASS summary draft/confirmed values, reset and standard category')

  // Integration with the existing real history hook: no duplicated step owner.
  await action('select', saved.id)
  assert.equal((await snapshot()).active, saved.id)
  assert.deepEqual(await state(), pick(saved))
  const before = await stored()
  await action('rename', saved.id)
  await action('setTitle', '수정된 합성 이름')
  assert.deepEqual(await stored(), before, 'rename draft/menu render must not rewrite the active consultation')
  await action('submitRename')
  assert.deepEqual(await state(), pick(saved))
  assert.equal((await stored()).sessions[0].updatedAt, before.sessions[0].updatedAt)
  await action('changeSummaryLocation', location)
  const changed = (await stored()).sessions.find(session => session.id === saved.id)
  assert.deepEqual(pick(changed), { ...pick(saved), confirmedLocation: location, confirmedTargetCustomer: null, confirmedOperatingHours: null, isSummaryConfirmed: false })
  assert.equal(changed.title, '수정된 합성 이름')
  await action('new')
  assert.deepEqual(await state(), initial)
  assert.equal((await snapshot()).active, null)
  await action('begin')
  const createdId = (await snapshot()).active
  assert.ok(createdId && createdId !== saved.id)
  await action('changeSummaryCategory', '합성 신규 업종')
  await action('select', saved.id)
  assert.deepEqual(await state(), pick(changed))
  await action('select', createdId)
  assert.equal((await state()).confirmedCategory, 'OTHER')
  assert.equal((await state()).confirmedCustomCategory, '합성 신규 업종')
  await action('delete', createdId)
  await action('cancelDelete')
  assert.equal((await snapshot()).active, createdId)
  await action('delete', createdId)
  await action('confirmDelete')
  assert.deepEqual(await state(), initial)
  assert.equal((await snapshot()).active, null)
  console.log('PASS history restore/save, rename draft stability, new/selection and active deletion reset')

  const account901 = await stored()
  await action('switchAccount', 902)
  assert.equal((await snapshot()).userId, 902)
  assert.deepEqual(await state(), initial)
  assert.deepEqual((await snapshot()).sessions, [])
  assert.deepEqual(await stored(901), account901)
  console.log('PASS account-keyed remount isolates flow and existing history')
  assert.deepEqual(errors, [])
  assert.deepEqual(blocked, [])
  console.log(`Artifacts: ${output}; synthetic StrictMode hooks only, no business HTTP or real data.`)
} finally {
  await browser?.close()
  await server.close()
}
