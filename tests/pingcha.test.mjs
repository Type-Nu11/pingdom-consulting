import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer, loadConfigFromFile } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const server = await createServer({ configFile: false, root, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
const { pingchaClient, isBrowserVerified, isVerificationMessage } =
  await server.ssrLoadModule('/src/features/auth/pingchaApi.ts')
after(() => server.close())

test('서버가 확인한 검증 완료 또는 검증 비활성 상태만 통과한다', async () => {
  for (const [data, expected] of [
    [{ enabled: true, verified: true }, true],
    [{ enabled: true, verified: false }, false],
    [{ enabled: false, verified: false }, true],
  ]) {
    pingchaClient.defaults.adapter = async (config) => {
      assert.equal(config.baseURL, '/_pingdom/pingcha')
      assert.equal(config.url, '/status')
      assert.equal(config.withCredentials, true)
      return { config, data, status: 200, statusText: 'OK', headers: {} }
    }
    assert.equal(await isBrowserVerified(), expected)
  }
})

test('잘못된 상태 응답과 서버 장애는 검증 완료로 처리하지 않는다', async () => {
  for (const data of [{}, { enabled: true, verified: 'true' }, '<html>SPA fallback</html>']) {
    pingchaClient.defaults.adapter = async (config) => ({ config, data, status: 200, statusText: 'OK', headers: {} })
    await assert.rejects(isBrowserVerified())
  }
  pingchaClient.defaults.adapter = () => Promise.reject(new Error('Unavailable'))
  await assert.rejects(isBrowserVerified())
})

test('같은 출처의 현재 iframe 메시지만 신뢰한다', () => {
  globalThis.window = { location: { origin: 'http://localhost:5173' } }
  try {
    const source = {}
    const event = { source, origin: window.location.origin, data: { type: 'pingcha:verified' } }
    assert.equal(isVerificationMessage(event, source), true)
    assert.equal(isVerificationMessage({ ...event, source: {} }, source), false)
    assert.equal(isVerificationMessage({ ...event, origin: 'https://foreign.example' }, source), false)
    assert.equal(isVerificationMessage({ ...event, data: null }, source), false)
    assert.equal(isVerificationMessage(event, null), false)
  } finally { delete globalThis.window }
})

test('개발 프록시는 로컬 검증 요청의 Origin만 변환하고 외부 출처를 보존한다', async () => {
  const { config } = await loadConfigFromFile({ command: 'serve', mode: 'development' }, undefined, root)
  const options = config.server.proxy['/_pingdom']
  let handler
  options.configure({ on: (name, listener) => { assert.equal(name, 'proxyReq'); handler = listener } })
  const transform = (origin, site = 'same-origin', url = '/_pingdom/pingcha/verify') => {
    const headers = new Map([['Origin', origin]])
    handler({ setHeader: (name, value) => headers.set(name, value) }, {
      url, headers: { host: 'localhost:5173', origin, 'sec-fetch-site': site },
    })
    return headers.get('Origin')
  }
  assert.equal(transform('http://localhost:5173'), new URL(options.target).origin)
  assert.equal(transform('https://foreign.example'), 'https://foreign.example')
  assert.equal(transform('http://localhost:5173', 'cross-site'), 'http://localhost:5173')
  assert.equal(transform('invalid-origin'), 'invalid-origin')
  assert.equal(transform('http://localhost:5173', 'same-origin', '/_pingdom/other'), 'http://localhost:5173')
})
