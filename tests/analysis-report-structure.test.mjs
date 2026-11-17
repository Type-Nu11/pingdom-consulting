import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const root = new URL('../', import.meta.url)
const baseline = JSON.parse(readFileSync(new URL('./fixtures/analysis-report-structure-baseline.json', import.meta.url), 'utf8'))
const parse = path => ts.createSourceFile(path, readFileSync(new URL(path, root), 'utf8'), ts.ScriptTarget.Latest, true, path.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
const page = parse('src/pages/home/AiHomePage.tsx')
const source = parse('src/features/analysis/hooks/useAnalysisReport.ts')
const main = page.statements.find(node => node.name?.text === 'AiHomePage')
const hook = source.statements.find(node => node.name?.text === 'useAnalysisReport')
const declarations = block => block.statements.filter(ts.isVariableStatement).flatMap(node => [...node.declarationList.declarations])
const nameOf = node => ts.isArrayBindingPattern(node.name) ? node.name.elements[0].name.text : node.name.text
function canonical(node) {
  const children = []
  ts.forEachChild(node, child => { children.push(canonical(child)) })
  return [node.kind, ...(children.length ? children : [node.text ?? null])]
}
const digest = input => createHash('sha256').update(input).digest('hex')
const hash = node => digest(JSON.stringify(canonical(node)))

test('report states and resource refs have one owner and retain the original initializers', () => {
  assert.equal(baseline.baseCommit, '4c49b5f3010242b319805e47b1716e64f88a52ff')
  assert.equal(baseline.sourcePath, 'src/pages/home/AiHomePage.tsx')
  assert.equal(baseline.hashAlgorithm, 'sha256')
  for (const [name, expected] of Object.entries(baseline.declarations)) {
    const owned = declarations(hook.body).filter(node => nameOf(node) === name)
    assert.equal(owned.length, 1, name)
    assert.equal(hash(owned[0]), expected, name)
    assert.equal(declarations(main.body).filter(node => nameOf(node) === name).length, 0, name)
  }
  assert.equal(hash(source.statements.find(node => node.name?.text === 'AnalysisProgressStage')), baseline.stage)
  assert.equal(hash(declarations(source).find(node => node.name.text === 'ANALYSIS_PROGRESS_MESSAGE_GAP_MS')), baseline.gap)
})

test('report hook uses existing API/storage without owning inputs, consent or consultation state', () => {
  assert.deepEqual(source.statements.filter(ts.isImportDeclaration).map(node => node.moduleSpecifier.text), ['react', '../locationAnalysisReportApi', '../locationAnalysisReportStorage', '../../api/apiClient'])
  assert.doesNotMatch(source.text, /useConsultationFlow|useConsultationHistory|setIsSummaryConfirmed|privacyConsent|localStorage|sessionStorage|pages\//)
  assert.doesNotMatch(page.text, /analysisReportRequestRef|analysisProgressMessageTimerRef|requestLocationAnalysisReport|readLocationAnalysisReport|saveLocationAnalysisReport|deleteLocationAnalysisReport|URL\.createObjectURL/)
  assert.equal(declarations(main.body).filter(node => ts.isCallExpression(node.initializer) && node.initializer.expression.getText(page) === 'useAnalysisReport').length, 1)
  const submit = hook.body.statements.find(node => node.name?.text === 'submitAnalysisReport')
  assert.deepEqual(submit.parameters.map(node => node.name.text), ['buildRequest', 'confirmSummary', 'clearSummaryConfirmation'])
})

test('API, PDF storage schema/key and page styling remain byte-for-byte unchanged', () => {
  for (const [path, expected] of Object.entries(baseline.files)) assert.equal(digest(readFileSync(new URL(path, root))), expected, path)
})
