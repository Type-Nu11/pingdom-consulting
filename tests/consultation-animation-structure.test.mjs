import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const root = new URL('../', import.meta.url)
const baseline = JSON.parse(readFileSync(new URL('./fixtures/consultation-animation-baseline.json', import.meta.url), 'utf8'))
const pagePath = 'src/pages/home/AiHomePage.tsx'
const parse = path => ts.createSourceFile(path, readFileSync(new URL(path, root), 'utf8'), ts.ScriptTarget.Latest, true, path.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
const page = parse(pagePath)
const main = page.statements.find(node => node.name?.text === 'AiHomePage')
const hooks = Object.fromEntries(['useTypewriter', 'useCategorySequence', 'useConversationTransition'].map(name => [name, parse(`src/features/consultation/hooks/${name}.ts`)]))
const declarations = block => block.statements.filter(ts.isVariableStatement).flatMap(node => [...node.declarationList.declarations])
function canonical(node) {
  const children = []
  ts.forEachChild(node, child => { children.push(canonical(child)) })
  return [node.kind, ...(children.length ? children : [node.text ?? null])]
}
const hash = node => createHash('sha256').update(JSON.stringify(canonical(node))).digest('hex')

test('the same sequence, timing constants and animation defaults retain a single owner', () => {
  assert.equal(baseline.baseCommit, '38c5c93496b74378c88d5ac5228623025ec0dcc8')
  assert.equal(baseline.sourcePath, pagePath)
  const owners = {
    CATEGORY_TEXT_SEQUENCE: hooks.useCategorySequence,
    CATEGORY_CONFIRM_INDEX: page,
    ASSISTANT_RESPONSE_LOADING_DELAY: page,
    CONVERSATION_TRANSITION_DELAY: hooks.useConversationTransition,
  }
  for (const [name, file] of Object.entries(owners)) {
    const owner = declarations(file).filter(node => node.name.text === name)
    assert.equal(owner.length, 1)
    assert.equal(hash(owner[0]), baseline.constants[name])
    for (const other of [page, ...Object.values(hooks)].filter(source => source !== file)) {
      assert.ok(!declarations(other).some(node => node.name.text === name))
    }
  }
  for (const [name, expected] of Object.entries(baseline.animationParameters)) {
    const definition = hooks[name].statements.find(node => node.name?.text === name)
    assert.deepEqual(definition.parameters.map(hash), expected)
  }
})

test('all seven typewriters and category sequence keep their exact inputs and relative render order', () => {
  const calls = declarations(main.body).filter(node => node.initializer && ts.isCallExpression(node.initializer)
    && ['useTypewriter', 'useCategorySequence'].includes(node.initializer.expression.getText(page)))
  assert.equal(calls.length, 8)
  assert.deepEqual(calls.map(hash), baseline.calls)
  const transition = main.body.statements.find(node => ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)
    && node.expression.expression.getText(page) === 'useConversationTransition')
  const intro = declarations(main.body).find(node => node.initializer && ts.isCallExpression(node.initializer)
    && node.initializer.expression.getText(page) === 'useConsultationIntro')
  assert.ok(calls.at(-1).end < transition.getStart(page))
  assert.ok(transition.end < intro.getStart(page))
})

test('animation hooks depend only on React and the existing category model', () => {
  for (const [name, file] of Object.entries(hooks)) {
    assert.deepEqual(file.statements.filter(ts.isImportDeclaration).map(node => node.moduleSpecifier.text),
      name === 'useCategorySequence' ? ['react', '../model/consultationOptions'] : ['react'])
    assert.doesNotMatch(file.text, /localStorage|sessionStorage|indexedDB|fetch\(|useConsultationHistory|useAnalysisReport/)
  }
  assert.doesNotMatch(hooks.useConversationTransition.text, /useState\(|useRef\(/)
})
