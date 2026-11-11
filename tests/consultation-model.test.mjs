import assert from 'node:assert/strict'
import { after, beforeEach, test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, sep } from 'node:path'
import ts from 'typescript'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const server = await createServer({ configFile: false, envDir: false, root, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
const model = await server.ssrLoadModule('/src/features/consultation/model/consultationHistory.ts')
const options = await server.ssrLoadModule('/src/features/consultation/model/consultationOptions.ts')
const { OPERATING_DAYS } = await server.ssrLoadModule('/src/features/consultation/model/operatingHours.types.ts')
const { OPERATING_TIME_OPTIONS } = await server.ssrLoadModule('/src/features/consultation/model/operatingHoursOptions.ts')
const { AGE_GROUPS, CUSTOMER_NATIONALITIES } = await server.ssrLoadModule('/src/features/consultation/model/targetCustomerOptions.ts')
const { readConsultationHistory, writeConsultationHistory } = await server.ssrLoadModule('/src/features/consultation/storage/consultationHistoryStorage.ts')
const values = new Map()
const previousWindow = globalThis.window
const fixture = JSON.parse(readFileSync(new URL('./fixtures/consultation-history-v1.json', import.meta.url), 'utf8'))
const key = id => `pingdom-ai-consultation-history-v1:${id}`
const empty = { activeSessionId: null, sessions: [] }
beforeEach(() => {
  values.clear()
  globalThis.window = { localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) } }
})
after(async () => {
  await server.close()
  if (previousWindow === undefined) delete globalThis.window
  else globalThis.window = previousWindow
})

test('업종 코드·표시명·순서를 기존 계약으로 유지한다', () => {
  assert.deepEqual(options.STORE_CATEGORIES.map(item => item.code), ['RESTAURANT', 'MUSIC', 'POP_UP', 'FASHION', 'BEAUTY', 'EXHIBITION', 'CAFE', 'CULTURAL_HERITAGE', 'OTHER'])
  assert.deepEqual(options.STORE_CATEGORY_LABELS, ['음식점', '음악', '팝업', '패션', '뷰티', '전시', '카페', '문화재', '기타'])
})

test('제목은 공백을 합치고 앞뒤만 정리하며 길이를 임의로 자르지 않는다', () => {
  assert.equal(model.createSessionTitle('  합성\n 카페\t 상담  '), '합성 카페 상담')
  assert.equal(model.createSessionTitle('  '), '')
  assert.equal(model.createSessionTitle('가'.repeat(100)), '가'.repeat(100))
})

test('영업 요일과 30분 단위 운영시간 선택 범위를 유지한다', () => {
  assert.deepEqual(OPERATING_DAYS, ['평일', '주말', '매일'])
  assert.equal(OPERATING_TIME_OPTIONS.length, 49)
  assert.equal(new Set(OPERATING_TIME_OPTIONS).size, 49)
  assert.equal(OPERATING_TIME_OPTIONS[0], '00:00')
  assert.equal(OPERATING_TIME_OPTIONS[1], '00:30')
  assert.equal(OPERATING_TIME_OPTIONS[18], '09:00')
  assert.equal(OPERATING_TIME_OPTIONS.at(-1), '24:00')
})

test('고객층 연령·국적 선택값과 표시 순서를 유지한다', () => {
  assert.deepEqual(AGE_GROUPS, ['10대', '20대', '30대', '40대', '50대', '60대', '70대', '80대', '90대'])
  assert.deepEqual(CUSTOMER_NATIONALITIES, ['내국인', '외국인', '상관 없음'])
})

test('미리보기는 유니코드 코드 포인트 11개까지 보존한다', () => {
  assert.equal(model.formatSessionPreview('가'.repeat(11)), '가'.repeat(11))
  assert.equal(model.formatSessionPreview('가'.repeat(12)), '가'.repeat(11) + '...')
  assert.equal(model.formatSessionPreview('😀'.repeat(12)), '😀'.repeat(11) + '...')
  assert.equal(model.formatSessionPreview(''), '')
})

test('고객층은 연령을 정렬하고 연속 구간만 묶으며 원본을 변경하지 않는다', () => {
  const customer = { ageGroups: ['50대', '30대', '20대', '60대'], nationality: '외국인' }
  const before = structuredClone(customer)
  assert.equal(model.formatTargetCustomerGroup(customer), '20~30대, 50~60대 외국인')
  assert.deepEqual(customer, before)
  assert.equal(model.formatTargetCustomerGroup({ ageGroups: ['20대'], nationality: '내국인' }), '20대 내국인')
})

test('고정 우선·최근 수정순이며 동률의 입력 순서와 원본 배열을 유지한다', () => {
  const items = [{ id: 'latest', updatedAt: 100, isPinned: false }, { id: 'pinned', updatedAt: 1, isPinned: true }, { id: 'same-a', updatedAt: 50 }, { id: 'same-b', updatedAt: 50 }]
  const before = structuredClone(items)
  const result = model.sortSessions(items)
  assert.deepEqual(result.map(item => item.id), ['pinned', 'latest', 'same-a', 'same-b'])
  assert.deepEqual(items, before)
  assert.notEqual(result, items)
  assert.equal(result[0], items[1])
})

test('기존 v1 전체 필드·선택 값·알 수 없는 필드·활성 ID를 그대로 읽는다', () => {
  const serialized = JSON.stringify(fixture)
  values.set(key(901), serialized)
  assert.deepEqual(readConsultationHistory(901), fixture)
  assert.equal(values.get(key(901)), serialized, '읽기 자체는 저장소를 수정하지 않는다')
})

test('저장 키와 JSON 구조를 바꾸거나 메타데이터를 추가하지 않는다', () => {
  const before = structuredClone(fixture)
  assert.equal(writeConsultationHistory(fixture, 901), undefined)
  assert.deepEqual([...values.keys()], [key(901)])
  assert.equal(values.get(key(901)), JSON.stringify(fixture))
  assert.deepEqual(fixture, before)
  assert.deepEqual(readConsultationHistory(901), fixture)
})

test('계정별 읽기·쓰기가 격리되고 구버전 비계정 키를 임의 귀속하지 않는다', () => {
  values.set('pingdom-ai-consultation-history-v1', JSON.stringify(fixture))
  assert.deepEqual(readConsultationHistory(901), empty)
  writeConsultationHistory(fixture, 901)
  writeConsultationHistory(empty, 902)
  assert.deepEqual(readConsultationHistory(901), fixture)
  assert.deepEqual(readConsultationHistory(902), empty)
  assert.equal(values.get('pingdom-ai-consultation-history-v1'), JSON.stringify(fixture))
})

test('예전 최소 필드 검증을 강화하거나 세션 순서를 재정렬하지 않는다', () => {
  const a = { id: 'a', title: '', createdAt: 1, updatedAt: 1, submittedPrompt: null }
  const b = { ...a, id: 'b', updatedAt: 99, isPinned: true }
  values.set(key(901), JSON.stringify({ activeSessionId: 'missing', sessions: [a, b] }))
  assert.deepEqual(readConsultationHistory(901), { activeSessionId: 'missing', sessions: [a, b] })
})

test('기존 필수 식별 필드가 잘못된 항목만 걸러낸다', () => {
  const a = fixture.sessions[0]
  const invalid = [null, 1, {}, { ...a, id: 1 }, { ...a, title: null }, { ...a, createdAt: '1' }, { ...a, updatedAt: null }, { ...a, submittedPrompt: 1 }]
  values.set(key(901), JSON.stringify({ activeSessionId: 1, sessions: [...invalid, a] }))
  assert.deepEqual(readConsultationHistory(901), { activeSessionId: null, sessions: [a] })
})

test('미저장·손상 JSON·잘못된 최상위 구조는 빈 이력으로 읽고 원문을 덮어쓰지 않는다', () => {
  assert.deepEqual(readConsultationHistory(901), empty)
  for (const raw of ['{broken', 'null', '1', '[]', '{}', '{"sessions":null}', '{"sessions":{}}']) {
    values.set(key(901), raw)
    assert.deepEqual(readConsultationHistory(901), empty)
    assert.equal(values.get(key(901)), raw)
  }
})

test('localStorage 속성 접근 또는 getItem 실패를 기존처럼 빈 이력으로 처리한다', () => {
  globalThis.window = { get localStorage() { throw new Error('Synthetic denied') } }
  assert.deepEqual(readConsultationHistory(901), empty)
  globalThis.window = { localStorage: { getItem() { throw new Error('Synthetic read failure') } } }
  assert.deepEqual(readConsultationHistory(901), empty)
})

test('쓰기 거부와 직렬화 실패를 전파하거나 다른 계정 데이터를 지우지 않는다', () => {
  values.set(key(902), JSON.stringify(fixture))
  globalThis.window.localStorage.setItem = () => { throw new Error('Synthetic quota') }
  assert.doesNotThrow(() => writeConsultationHistory(fixture, 901))
  assert.equal(values.get(key(901)), undefined)
  assert.equal(values.get(key(902)), JSON.stringify(fixture))
  const cyclic = {}; cyclic.self = cyclic
  assert.doesNotThrow(() => writeConsultationHistory(cyclic, 901))
})

test('model/storage의 import·재내보내기는 페이지 내부를 역참조하지 않는다', () => {
  for (const folder of ['model', 'storage']) {
    const directory = resolve(root, 'src/features/consultation', folder)
    for (const name of readdirSync(directory).filter(name => name.endsWith('.ts'))) {
      const path = resolve(directory, name)
      const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true)
      for (const node of source.statements) {
        if (!(ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) || !node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) continue
        const specifier = node.moduleSpecifier.text
        if (specifier.startsWith('.')) assert.equal(resolve(dirname(path), specifier).includes(`${sep}src${sep}pages${sep}`), false, path)
      }
    }
  }
})
