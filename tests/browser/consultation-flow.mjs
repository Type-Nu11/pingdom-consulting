import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { chromium } from 'playwright'

const output = await mkdtemp(join(tmpdir(), 'consultation-71-'))
async function assertLayout(page, stage) {
  await page.clock.runFor(1500)
  const overflow = await page.evaluate(() => {
    // Browser clocks advance JS timers, not CSS animation timelines.
    for (const animation of document.getAnimations()) {
      if (animation.effect && Number.isFinite(animation.effect.getComputedTiming().endTime)) animation.finish()
    }
    const issues = []
    if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('document overflow')
    const root = document.querySelector('[role="dialog"][aria-modal="true"]') ?? document.body
    for (const element of [root, ...root.querySelectorAll('*')]) {
      const rect = element.getBoundingClientRect(), style = getComputedStyle(element)
      if (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= innerHeight || style.visibility === 'hidden' || style.opacity === '0' || element.closest('[aria-hidden="true"]')) continue
      const label = `${element.tagName} ${element.getAttribute('aria-label') ?? element.getAttribute('role') ?? ''}`
      if (rect.left < -1 || rect.right > innerWidth + 1) issues.push(`${label}: outside viewport`)
      if (element.children.length && ['auto', 'scroll'].includes(style.overflowX) && element.scrollWidth > element.clientWidth + 1) issues.push(`${label}: horizontal scroll`)
    }
    return issues.slice(0, 15)
  })
  assert.deepEqual(overflow, [], `${stage}: layout overflow`)
}
const server = await createServer({ configFile: false, envDir: false, plugins: [react(), {
  name: 'synthetic-consultation', enforce: 'pre',
  resolveId(source) { if (/\/location\/naver(MapLoader|LocationSearch)$/.test(source)) return resolve('tests/browser/location-fixture.js') },
  configureServer(vite) { vite.middlewares.use(async (req, res, next) => {
    if (!['/', '/login'].includes(req.url.split('?')[0])) return next()
    res.setHeader('Content-Type', 'text/html')
    res.end(await vite.transformIndexHtml(req.url, (await readFile('index.html', 'utf8')).replace('/src/main.tsx', '/tests/browser/consultation-fixture.jsx')))
  }) },
}], cacheDir: join(output, 'cache'), server: { host: '127.0.0.1', port: 18471, strictPort: false } })
let browser, page
try {
  await server.listen()
  browser = await chromium.launch()
  const base = `http://127.0.0.1:${server.httpServer.address().port}`
  console.log(`Artifacts: ${output}`)
  for (const [width, height] of [[1920, 1080], [1366, 768], [390, 844]]) {
    const context = await browser.newContext({ viewport: { width, height } })
    page = await context.newPage()
    page.setDefaultTimeout(15000)
    const errors = [], blocked = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/*', route => {
      const url = new URL(route.request().url())
      if (url.origin === base && !url.pathname.startsWith('/api')) return route.continue()
      if (['fonts.googleapis.com', 'fonts.gstatic.com'].includes(url.hostname)) return route.continue()
      if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.startsWith('/gh/orioncactus/pretendard/')) return route.continue()
      blocked.push(url.origin + url.pathname); return route.abort()
    })
    await page.clock.install()
    const advance = () => page.clock.runFor(60000)
    const click = async name => {
      const button = page.getByRole('button', { name, exact: true })
      if (name.endsWith(' 메뉴')) { await button.focus(); await button.press('Enter') }
      else await button.click()
    }
    const history = () => page.evaluate(() => JSON.parse(localStorage.getItem('pingdom-ai-consultation-history-v1:901')))
    const openSaved = async () => {
      if (width <= 640) await page.setViewportSize({ width: 1366, height })
      await click('합성 카페 상담'); await advance()
      if (width <= 640) await page.setViewportSize({ width, height })
    }
    await page.goto(base)
    await page.getByRole('textbox', { name: 'AI 질문 입력' }).fill('합성 카페 상담')
    await page.getByRole('textbox', { name: 'AI 질문 입력' }).press('Enter')
    await advance()
    await page.getByRole('button', { name: '선택하기', exact: true }).waitFor()
    await assertLayout(page, 'category')
    await click('카페')
    await click('선택하기')
    await advance()
    await page.getByRole('textbox', { name: '희망 장소 검색' }).waitFor()
    await assertLayout(page, 'location')
    await page.getByRole('textbox', { name: '희망 장소 검색' }).fill('합성 장소')
    await click('장소 검색')
    await page.getByRole('button').filter({ hasText: '합성 장소' }).click()
    await click('이 장소로 선택')
    await advance()
    await page.getByRole('button', { name: '이 고객층으로 선택', exact: true }).waitFor()
    await assertLayout(page, 'customers')
    await click('20대'); await click('내국인'); await click('이 고객층으로 선택')
    await advance()
    await page.getByRole('button', { name: '이 시간대로 선택', exact: true }).waitFor()
    await assertLayout(page, 'operating hours')
    await page.getByRole('button', { name: /^시작/ }).click(); await click('09:00')
    await click('18:00')
    await click('이 시간대로 선택'); await advance()
    await page.getByRole('heading', { name: '상담 정보 확인' }).waitFor()
    await assertLayout(page, 'summary initial')
    const conversationScrollTop = () => page.getByRole('heading', { name: '상담 정보 확인' }).evaluate(element => {
      let container = element.parentElement
      while (container && getComputedStyle(container).overflowY !== 'auto') container = container.parentElement
      return container?.scrollTop ?? 0
    })
    const beforeWheel = await conversationScrollTop()
    await page.mouse.move(width > 768 ? (width + 256) / 2 : width / 2, height / 2)
    await page.mouse.wheel(0, beforeWheel > 1 ? -250 : 250)
    await page.waitForFunction(before => [...document.querySelectorAll('main *')].some(element =>
      getComputedStyle(element).overflowY === 'auto' && element.scrollHeight > element.clientHeight && element.scrollTop !== before,
    ), beforeWheel)
    assert.notEqual(await conversationScrollTop(), beforeWheel, 'conversation remains vertically scrollable')
    assert.equal(await page.locator('main').evaluate(element => element.scrollLeft), 0)
    await page.getByRole('button', { name: '수정', exact: true }).first().click()
    const categoryEditor = page.locator('[aria-label="가게 업종 수정"]')
    await categoryEditor.getByRole('button', { name: '음식점', exact: true }).click()
    await categoryEditor.getByRole('button', { name: '적용', exact: true }).click()
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('pingdom-ai-consultation-history-v1:901')).sessions[0].confirmedCategory === 'RESTAURANT')
    const edited = (await history()).sessions[0]
    assert.equal(edited.confirmedCategory, 'RESTAURANT')
    assert.equal(edited.confirmedLocation.displayName, '합성 장소')
    assert.deepEqual(edited.confirmedTargetCustomer.ageGroups, ['20대'])
    assert.equal(edited.confirmedOperatingHours.startTime, '09:00')
    await assertLayout(page, 'summary')
    await page.screenshot({ path: join(output, `summary-${width}.png`) })
    const requestReport = async (consentWasRetained = false) => {
      const previous = await page.evaluate(() => window.qa.requests.filter(item => item.url === '/analysis/reports/location').length)
      await click('이 정보로 분석 요청')
      const dialog = page.getByRole('dialog', { name: '보고서 보관 확인' })
      await assertLayout(page, 'report consent dialog')
      assert.equal(await dialog.getByRole('textbox', { name: '이메일', exact: true }).inputValue(), 'synthetic-901@example.test')
      assert.equal(await dialog.getByRole('checkbox').isChecked(), consentWasRetained)
      assert.equal(await dialog.getByRole('button', { name: '분석 요청하기' }).isDisabled(), !(await dialog.getByRole('checkbox').isChecked()))
      await dialog.getByRole('checkbox').check()
      await dialog.getByRole('button', { name: '분석 요청하기' }).click()
      await page.waitForFunction(previous => window.qa.requests.filter(item => item.url === '/analysis/reports/location').length > previous, previous)
      const body = await page.evaluate(() => JSON.parse(window.qa.requests.filter(item => item.url === '/analysis/reports/location').at(-1).data))
      assert.deepEqual(body, {
        region: '합성 주소', category: '음식점', targetCustomerGroup: '20대 내국인',
        operatingHours: '평일 09:00~18:00', email: 'synthetic-901@example.test', privacyConsent: true,
      }, 'report request must match selected conditions and the authenticated account')
    }
    await page.evaluate(() => { window.qa.mode = 'failure' })
    await requestReport(); await advance()
    await page.getByRole('alert').waitFor()
    await assertLayout(page, 'report error')
    assert.equal((await history()).sessions[0].confirmedLocation.displayName, '합성 장소')
    await page.evaluate(() => { window.qa.mode = 'success' })
    await requestReport(true); await advance()
    const pdf = page.getByRole('button', { name: /다운로드/ })
    await pdf.waitFor()
    await assertLayout(page, 'report success')
    const download = page.waitForEvent('download'); await pdf.click()
    assert.equal((await download).suggestedFilename(), 'synthetic.pdf')
    await page.reload(); await advance()
    assert.equal(await pdf.count(), 0, 'reload restores the list, not the active conversation')
    await openSaved(); await pdf.waitFor()
    assert.equal(await page.evaluate(() => window.qa.requests.length), 0, 'PDF restoration must not request a paid analysis')
    assert.equal((await history()).sessions.length, 1)
    await page.evaluate(() => {
      const key = 'pingdom-ai-consultation-history-v1:901'
      const saved = JSON.parse(localStorage.getItem(key))
      saved.sessions[0].isSummaryConfirmed = false
      localStorage.setItem(key, JSON.stringify(saved))
    })
    await page.reload(); await advance(); await openSaved()
    await page.evaluate(() => { window.qa.mode = 'hold' })
    await requestReport()
    await page.waitForFunction(() => typeof window.qa.release === 'function')
    assert.equal(await page.getByRole('button', { name: '상권 분석 중...', exact: true }).isDisabled(), true)
    assert.equal(await page.evaluate(() => window.qa.requests.filter(item => item.url === '/analysis/reports/location').length), 1)
    await page.evaluate(() => window.qa.account(902)); await advance()
    await page.evaluate(() => window.qa.release()); await advance()
    assert.equal(await pdf.count(), 0, 'late report cannot enter another account')
    await page.evaluate(() => window.qa.account(901)); await advance(); await openSaved(); await pdf.waitFor()
    // The mobile sidebar is intentionally hidden in the current product.
    if (width > 640) {
      await click('합성 카페 상담 메뉴')
      await page.getByRole('menuitem', { name: '이름 변경' }).click()
      const rename = page.getByRole('textbox', { name: '세션 이름 변경' })
      await rename.fill('합성 이름 변경'); await rename.press('Enter')
      await click('합성 이름 변경 메뉴'); await page.getByRole('menuitem', { name: '고정하기' }).click()
      assert.equal((await history()).sessions[0].isPinned, true)
      await click('새 상담')
      await page.getByRole('textbox', { name: 'AI 질문 입력' }).waitFor()
      await click('합성 이름 변경'); await advance(); await pdf.waitFor()
      await click('합성 이름 변경 메뉴'); await page.getByRole('menuitem', { name: '삭제', exact: true }).click()
      await page.getByRole('dialog', { name: '채팅을 삭제할까요?' }).getByRole('button', { name: '취소' }).click()
      assert.equal((await history()).sessions.length, 1)
      await click('합성 이름 변경 메뉴'); await page.getByRole('menuitem', { name: '삭제', exact: true }).click()
      await page.getByRole('dialog', { name: '채팅을 삭제할까요?' }).getByRole('button', { name: '삭제', exact: true }).click()
      assert.equal((await history()).sessions.length, 0)
    }
    await page.evaluate(() => window.qa.account(902)); await advance()
    await page.getByRole('textbox', { name: 'AI 질문 입력' }).waitFor()
    assert.equal(await pdf.count(), 0, 'another account cannot see the prior report')
    assert.deepEqual(await page.evaluate(() => window.qa.unexpected), [])
    assert.deepEqual(errors, [])
    assert.deepEqual(blocked, [])
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    console.log(`PASS ${width}x${height}: flow, consent, retry, PDF restoration/download, account isolation`)
    await context.close()
  }
  for (const mode of ['corrupt', 'blocked']) {
    const context = await browser.newContext()
    const testPage = await context.newPage()
    const errors = []
    testPage.on('pageerror', error => errors.push(error.message))
    await testPage.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort())
    await testPage.addInitScript(mode => {
      if (mode === 'corrupt') localStorage.setItem('pingdom-ai-consultation-history-v1:901', '{broken')
      else {
        const get = Storage.prototype.getItem, set = Storage.prototype.setItem
        Storage.prototype.getItem = function (...args) { if (this === localStorage) throw new Error('Synthetic storage denial'); return get.apply(this, args) }
        Storage.prototype.setItem = function (...args) { if (this === localStorage) throw new Error('Synthetic storage denial'); return set.apply(this, args) }
      }
    }, mode)
    await testPage.goto(base)
    await testPage.getByRole('textbox', { name: 'AI 질문 입력' }).waitFor()
    assert.deepEqual(errors, [])
    console.log(`PASS storage ${mode}: initial screen remains usable`)
    await context.close()
  }
} catch (error) {
  if (page && !page.isClosed()) { await page.screenshot({ path: join(output, 'failure.png') }); console.log((await page.locator('body').innerText()).slice(-6000)) }
  throw error
} finally { await browser?.close(); await server.close() }
