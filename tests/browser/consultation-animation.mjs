import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { chromium } from 'playwright'

const output = await mkdtemp(join(tmpdir(), 'consultation-animation-71-'))
const server = await createServer({
  configFile: false, envDir: false, cacheDir: join(output, 'cache'),
  plugins: [react(), {
    name: 'animation-fixture',
    configureServer(vite) {
      vite.middlewares.use(async (req, res, next) => {
        if (req.url.split('?')[0] !== '/animation-qa') return next()
        const html = (await readFile('index.html', 'utf8'))
          .replace(/<link\b[^>]*href="https:\/\/cdn\.jsdelivr\.net[^"]*"[^>]*>/g, '')
          .replace('/src/main.tsx', '/tests/browser/consultation-animation-fixture.jsx')
        res.setHeader('Content-Type', 'text/html')
        res.end(await vite.transformIndexHtml(req.url, html))
      })
    },
  }],
  server: { port: 0, host: '127.0.0.1' },
})

const categoryLabels = ['가게 카테고리', '1단계', '어떤 가게에 가장 가까운가요?', '아래 카테고리 중 하나를 선택해 주세요.', '음식점', '음악', '팝업', '패션', '뷰티', '전시', '카페', '문화재', '기타', '선택하기']
const idle = { displayedText: '', isComplete: false, isTyping: false }
const complete = text => ({ displayedText: text, isComplete: true, isTyping: false })
const errors = [], blocked = []
let browser
try {
  await server.listen()
  browser = await chromium.launch()
  const base = `http://127.0.0.1:${server.httpServer.address().port}`
  async function open(reducedMotion = 'no-preference') {
    const page = await browser.newPage({ reducedMotion })
    page.on('pageerror', error => errors.push(error.message))
    await page.route('**/*', route => {
      const url = new URL(route.request().url())
      if (url.origin === base && !url.pathname.startsWith('/api')) return route.continue()
      blocked.push(url.href)
      return route.abort()
    })
    const epoch = new Date('2026-11-18T00:00:00Z')
    await page.clock.install({ time: epoch })
    await page.clock.pauseAt(new Date(epoch.getTime() + 60_000))
    await page.goto(`${base}/animation-qa`)
    await page.getByRole('status').waitFor()
    return {
      page,
      run: (name, ...args) => page.evaluate(({ name, args }) => window.animationQa.run(name, ...args), { name, args }),
      state: () => page.evaluate(() => window.animationQa.state),
      timers: () => page.evaluate(() => window.animationQa.timers()),
      async advance(ms) {
        await page.clock.runFor(ms)
        // React commits from timer callbacks through its scheduler. Let browser
        // tasks settle without adding simulated milliseconds to timer boundaries.
        await page.evaluate(async () => {
          for (let i = 0; i < 2; i++) await new Promise(resolve => {
            const channel = new MessageChannel()
            channel.port1.onmessage = () => { channel.port1.close(); channel.port2.close(); resolve() }
            channel.port2.postMessage(null)
          })
        })
      },
    }
  }

  const { page, run, state, timers, advance } = await open()
  await advance(1)
  assert.deepEqual((await state()).text, idle)
  assert.deepEqual(await timers(), [])

  await run('submit', '합성 질문')
  await advance(479)
  assert.equal((await state()).submittedPrompt, null)
  await advance(1)
  assert.equal((await state()).submittedPrompt, '합성 질문')
  assert.equal((await state()).pendingPrompt, '합성 질문')
  await advance(219)
  assert.equal((await state()).pendingPrompt, '합성 질문')
  await advance(1)
  assert.equal((await state()).pendingPrompt, null)
  assert.deepEqual(await timers(), [])
  console.log('PASS exact 480ms question submission and 220ms handoff')

  await run('submit', '취소할 질문')
  await advance(250)
  await run('reset')
  await advance(600)
  assert.equal((await state()).submittedPrompt, null)
  await run('submit', '복원 전 질문')
  await advance(480)
  await run('restore', '복원 대기 질문', '기존 제출 질문')
  await advance(220)
  assert.equal((await state()).pendingPrompt, '복원 대기 질문')
  assert.equal((await state()).submittedPrompt, '기존 제출 질문')
  await advance(260)
  assert.equal((await state()).submittedPrompt, '복원 대기 질문')
  await advance(220)
  assert.equal((await state()).pendingPrompt, null)
  console.log('PASS reset and replacement clear both generations of transition timers')

  await run('apply', '가😀나', false)
  await advance(105)
  assert.deepEqual((await state()).text, { ...idle, isTyping: true })
  await advance(1)
  assert.equal((await state()).text.displayedText, '가')
  await run('render')
  await advance(16)
  assert.equal((await state()).text.displayedText, '가😀')
  await advance(16)
  assert.deepEqual((await state()).text, complete('가😀나'))
  assert.deepEqual(await timers(), [])
  await run('apply', '이전 타이핑', false)
  await advance(106)
  await run('apply', '새', false)
  await advance(16)
  assert.equal((await state()).text.displayedText, '')
  await advance(90)
  assert.deepEqual((await state()).text, complete('새'))
  console.log('PASS typewriter delay, Unicode steps, unrelated render and stale text cleanup')

  await run('apply', null, true)
  await advance(257)
  assert.equal((await state()).category.displayedItems[0], '')
  await advance(1)
  assert.equal((await state()).category.displayedItems[0], '가')
  await advance((Array.from(categoryLabels[0]).length - 1) * 38)
  assert.equal((await state()).category.displayedItems[0], categoryLabels[0])
  await advance(2 * 38)
  assert.equal((await state()).category.displayedItems[1], '')
  await advance(38)
  assert.equal((await state()).category.displayedItems[1], '1')
  await advance(10_000)
  assert.deepEqual((await state()).category, { displayedItems: categoryLabels, activeItemIndex: -1, isComplete: true })
  assert.deepEqual(await timers(), [])
  await run('apply', '복원된 안내', true, true)
  await advance(1)
  assert.deepEqual((await state()).text, complete('복원된 안내'))
  assert.deepEqual((await state()).category.displayedItems, categoryLabels)
  assert.deepEqual(await timers(), [])
  console.log('PASS category start, characters, two gap ticks, order and immediate restore')

  await run('apply', '정리할 안내', false)
  await advance(106)
  await run('apply', '정리할 안내', true)
  await advance(258)
  await run('submit', '남은 타이머')
  assert.ok((await timers()).some(([, delay]) => delay === 480))
  assert.ok((await timers()).some(([, delay]) => delay === 38))
  await run('switchAccount', 902)
  await advance(1)
  assert.equal((await state()).account, 902)
  assert.deepEqual((await state()).text, idle)
  assert.equal((await state()).category.isComplete, false)
  assert.deepEqual(await timers(), [])
  await run('apply', '언마운트', false)
  await run('submit', '정리 전 제출')
  await advance(480)
  assert.ok((await timers()).some(([, delay]) => delay === 220))
  await run('unmount')
  await page.getByText('Unmounted', { exact: true }).waitFor()
  assert.deepEqual(await timers(), [])
  await page.close()
  console.log('PASS account remount and unmount clear running intervals and pending handoffs')

  const reduced = await open('reduce')
  await reduced.run('apply', '모션 줄이기', true)
  await reduced.advance(1)
  assert.deepEqual((await reduced.state()).text, complete('모션 줄이기'))
  assert.deepEqual((await reduced.state()).category.displayedItems, categoryLabels)
  assert.deepEqual(await reduced.timers(), [])
  await reduced.run('submit', '전환은 그대로')
  await reduced.advance(479)
  assert.equal((await reduced.state()).submittedPrompt, null)
  await reduced.advance(1)
  assert.equal((await reduced.state()).submittedPrompt, '전환은 그대로')
  await reduced.page.close()
  assert.deepEqual(errors, [])
  assert.deepEqual(blocked, [])
  console.log('PASS reduced motion skips typing only; no real API or uncaught browser error')
} finally { await browser?.close(); await server.close() }
