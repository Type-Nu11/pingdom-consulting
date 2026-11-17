import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const root = new URL('../', import.meta.url)
const baseline = JSON.parse(readFileSync(new URL('./fixtures/consultation-intro-structure-baseline.json', import.meta.url), 'utf8'))
const pagePath = 'src/pages/home/AiHomePage.tsx'
const hookPath = 'src/features/consultation/hooks/useConsultationIntro.ts'
const parse = (path, text) => ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, path.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
const page = parse(pagePath, readFileSync(new URL(pagePath, root), 'utf8'))
const hook = parse(hookPath, readFileSync(new URL(hookPath, root), 'utf8'))
const main = page.statements.find(node => node.name?.text === 'AiHomePage')
const intro = hook.statements.find(node => node.name?.text === 'useConsultationIntro')
const declarations = block => block.statements.filter(ts.isVariableStatement).flatMap(node => [...node.declarationList.declarations])
const effects = block => block.statements.filter(node => ts.isExpressionStatement(node) && ts.isCallExpression(node.expression) && node.expression.expression.getText() === 'useEffect')
function canonical(node) {
  const children = []
  ts.forEachChild(node, child => { children.push(canonical(child)) })
  return [node.kind, ...(children.length ? children : [node.text ?? null])]
}
const hash = node => createHash('sha256').update(JSON.stringify(canonical(node))).digest('hex')

test('intro effect body, fallback and request ref match the fixed pre-extraction source', () => {
  assert.equal(baseline.baseCommit, 'b0a6f06aece2acc6408991b2d769a359284764ea')
  assert.equal(baseline.sourcePath, pagePath)
  assert.equal(baseline.hashAlgorithm, 'sha256')
  assert.equal(effects(intro.body).length, 1)
  assert.equal(hash(effects(intro.body)[0].expression.arguments[0]), baseline.effectBody)
  const find = (block, name) => declarations(block).find(node => node.name.text === name)
  assert.equal(hash(find(hook, 'CATEGORY_ASSISTANT_FALLBACK')), baseline.fallback)
  assert.equal(hash(find(intro.body, 'introRequestRef')), baseline.requestRef)
})

test('page passes its sole persisted message state and stable React setter directly', () => {
  const message = declarations(main.body).filter(node => ts.isArrayBindingPattern(node.name) && node.name.elements[0].name.text === 'assistantMessage')
  assert.equal(message.length, 1)
  assert.equal(message[0].name.elements[1].name.text, 'setAssistantMessage')
  assert.equal(message[0].initializer.expression.getText(page), 'useState')
  const calls = declarations(main.body).filter(node => ts.isCallExpression(node.initializer) && node.initializer.expression.getText(page) === 'useConsultationIntro')
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0].initializer.arguments[0].properties.map(node => node.getText(page)), ['submittedPrompt', 'assistantMessage', 'setAssistantMessage'])
  assert.doesNotMatch(hook.text, /useState\(|localStorage|sessionStorage|setTimeout|analysis|location|pages\//)
  assert.doesNotMatch(page.text, /introRequestRef|requestConsultationIntro|CATEGORY_ASSISTANT_FALLBACK/)
  assert.equal((page.text.match(/cancelIntro\(\)/g) ?? []).length, 3)
})

test('intro hook depends only on React and the existing API, and adds no request policy', () => {
  assert.deepEqual(hook.statements.filter(ts.isImportDeclaration).map(node => node.moduleSpecifier.text), ['react', '../consultationAiApi'])
  const cancel = intro.body.statements.find(node => node.name?.text === 'cancelIntro')
  assert.equal(cancel.body.statements.length, 1)
  assert.equal(cancel.body.statements[0].getText(hook), 'introRequestRef.current?.abort()')
  assert.deepEqual(intro.body.statements.find(ts.isReturnStatement).expression.properties.map(node => node.getText(hook)), ['cancelIntro'])
})
