import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const server = await createServer({ configFile: false, root, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
const { parseNaverPlaces, geocodeNaverAddress, reverseNaverAddress, searchNaverLocations } = await server.ssrLoadModule('/src/features/location/naverLocationSearch.ts')
const { apiClient } = await server.ssrLoadModule('/src/features/api/apiClient.ts')
const { loadNaverMaps } = await server.ssrLoadModule('/src/features/location/naverMapLoader.ts')
after(() => server.close())
const place = { name: '서울시청', roadAddress: '서울특별시 중구 세종대로 110', jibunAddress: '서울특별시 중구 태평로1가 31', latitude: 37.5666, longitude: 126.9784 }
const address = { roadAddress: place.roadAddress, jibunAddress: place.jibunAddress, x: String(place.longitude), y: String(place.latitude) }
const maps = { Service: { Status: { OK: 200 }, OrderType: { ADDR: 'addr', ROAD_ADDR: 'roadaddr' },
  geocode: (_options, callback) => callback(200, { v2: { addresses: [address] } }),
  reverseGeocode: (_options, callback) => callback(200, { v2: { address } }),
} }
const signal = () => new AbortController().signal

function mockResponse(data) {
  apiClient.defaults.adapter = async (config) => {
    assert.equal(config.url, '/users/me/merchant-place-applications/naver-place-search')
    assert.equal(config.params.query, '서울시청')
    return { config, data, status: 200, statusText: 'OK', headers: {} }
  }
}

test('네이버 장소 응답의 위경도와 주소를 기존 선택 계약으로 변환한다', () => {
  const [result] = parseNaverPlaces({ items: [place] })
  assert.equal(result.displayName, place.name)
  assert.equal(result.latitude, place.latitude)
  assert.equal(result.longitude, place.longitude)
  assert.equal(result.address, place.jibunAddress)
  assert.equal(result.source, 'search')
  assert.throws(() => parseNaverPlaces('<html>SPA fallback</html>'))
  assert.throws(() => parseNaverPlaces({ items: null }))
})

test('유효하지 않은 좌표와 주소 없는 장소는 선택 후보에서 제외한다', () => {
  for (const invalid of [{ latitude: NaN }, { longitude: Infinity }, { latitude: 126 }, { longitude: 181 }, { latitude: '37' }, { roadAddress: '', jibunAddress: '' }, { name: '' }]) {
    assert.deepEqual(parseNaverPlaces({ items: [{ ...place, ...invalid }] }), [])
  }
})

test('Geocoder 좌표의 x/y를 경도/위도로 변환하고 빈 좌표는 거부한다', async () => {
  const [result] = await geocodeNaverAddress(maps, '세종대로 110', signal())
  assert.equal(result.latitude, place.latitude)
  assert.equal(result.longitude, place.longitude)
  assert.equal(result.roadAddress, place.roadAddress)
  const emptyMaps = { Service: { ...maps.Service, geocode: (_, cb) => cb(200, { v2: { addresses: [{ ...address, x: '' }] } }) } }
  assert.deepEqual(await geocodeNaverAddress(emptyMaps, '주소', signal()), [])
})

test('지도 좌표는 역지오코딩 주소로 확정하고 실패한 주소를 확정하지 않는다', async () => {
  const position = { lat: () => place.latitude, lng: () => place.longitude }
  const result = await reverseNaverAddress(maps, position, signal())
  assert.equal(result.source, 'map')
  assert.equal(result.displayName, place.roadAddress)
  const failing = { Service: { ...maps.Service, reverseGeocode: (_, cb) => cb(500, {}) } }
  await assert.rejects(reverseNaverAddress(failing, position, signal()))
})

test('입력 변경으로 취소된 주소 요청은 늦은 성공 콜백을 수용하지 않는다', async () => {
  let complete
  const delayed = { Service: { ...maps.Service, geocode: (_, cb) => { complete = cb } } }
  const controller = new AbortController()
  const pending = geocodeNaverAddress(delayed, '주소', controller.signal)
  const rejected = assert.rejects(pending, { name: 'AbortError' })
  controller.abort()
  complete(200, { v2: { addresses: [address] } })
  await rejected
})

test('장소명 후보를 우선하고 같은 지점의 주소 결과를 중복 표시하지 않는다', async () => {
  globalThis.window = { naver: { maps } }
  try {
    mockResponse({ items: [place] })
    const result = await searchNaverLocations('서울시청', 'public-id', signal())
    assert.equal(result.length, 1)
    assert.equal(result[0].displayName, place.name)
  } finally { delete globalThis.window }
})

test('같은 건물의 서로 다른 상호는 선택 후보로 유지한다', async () => {
  globalThis.window = { naver: { maps } }
  try {
    mockResponse({ items: [place, { ...place, name: '시청 카페' }] })
    assert.deepEqual((await searchNaverLocations('서울시청', 'public-id', signal())).map((result) => result.displayName), [place.name, '시청 카페'])
  } finally { delete globalThis.window }
})

test('장소 검색 장애에도 유효한 주소 결과는 제공한다', async () => {
  globalThis.window = { naver: { maps } }
  try {
    apiClient.defaults.adapter = async () => { throw new Error('Unavailable') }
    const result = await searchNaverLocations('서울시청', 'public-id', signal())
    assert.equal(result[0].displayName, place.roadAddress)
  } finally { delete globalThis.window }
})

test('SDK 설정 장애에도 백엔드 장소 결과를 제공하며 전체 실패는 빈 결과로 숨기지 않는다', async () => {
  mockResponse({ items: [place] })
  assert.equal((await searchNaverLocations('서울시청', undefined, signal()))[0].displayName, place.name)
  mockResponse({ items: [] })
  await assert.rejects(searchNaverLocations('서울시청', undefined, signal()))
})

test('두 검색이 정상적으로 빈 결과를 반환할 때만 빈 후보를 반환한다', async () => {
  globalThis.window = { naver: { maps: { Service: { ...maps.Service, geocode: (_, cb) => cb(200, { v2: { addresses: [] } }) } } } }
  try {
    mockResponse({ items: [] })
    assert.deepEqual(await searchNaverLocations('서울시청', 'public-id', signal()), [])
  } finally { delete globalThis.window }
})

test('SDK 네트워크 실패 시 로더 상태를 초기화해 재시도할 수 있다', async () => {
  let script
  globalThis.window = { setTimeout, clearTimeout }
  globalThis.document = { getElementById: () => null, createElement: () => ({ remove() {} }), head: { append(value) { script = value } } }
  try {
    const failed = loadNaverMaps('public-id')
    const rejected = assert.rejects(failed)
    script.onerror()
    await rejected
  } finally { delete globalThis.window; delete globalThis.document }
})

test('SDK 로딩은 동시 호출을 공유하고 Geocoder 준비 후 완료한다', async () => {
  let script
  globalThis.window = { setTimeout, clearTimeout }
  globalThis.document = { getElementById: () => null, createElement: () => ({ remove() {} }), head: { append(value) { script = value } } }
  try {
    const first = loadNaverMaps('public-id')
    assert.equal(first, loadNaverMaps('public-id'))
    const url = new URL(script.src)
    assert.equal(url.hostname, 'oapi.map.naver.com')
    assert.equal(url.searchParams.get('ncpKeyId'), 'public-id')
    assert.equal(url.searchParams.get('submodules'), 'geocoder')
    assert.equal(url.searchParams.has('clientSecret'), false)
    window.naver = { maps }
    window.__pingdomNaverMapsReady()
    assert.equal(await first, maps)
  } finally { delete globalThis.window; delete globalThis.document }
})
