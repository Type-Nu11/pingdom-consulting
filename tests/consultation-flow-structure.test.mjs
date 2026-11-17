import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const root = new URL('../', import.meta.url)
const baseline = JSON.parse(readFileSync(new URL('./fixtures/consultation-flow-structure-baseline.json', import.meta.url), 'utf8'))
const parse = file => ts.createSourceFile(file, readFileSync(new URL(file, root), 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
const page = parse('src/pages/home/AiHomePage.tsx')
const flow = parse('src/features/consultation/hooks/useConsultationFlow.ts')
const intro = parse('src/features/consultation/hooks/useConsultationIntro.ts')
const introHook = intro.statements.find(node => node.name?.text === 'useConsultationIntro')
const main = page.statements.find(node => node.name?.text === 'AiHomePage')
const hook = flow.statements.find(node => node.name?.text === 'useConsultationFlow')
const declarations = block => block.statements.filter(ts.isVariableStatement).flatMap(node => [...node.declarationList.declarations])
const actions = new Map(hook.body.statements.filter(ts.isFunctionDeclaration).map(node => [node.name.text, node]))
actions.set('cancelIntro', introHook.body.statements.find(node => node.name?.text === 'cancelIntro'))
function canonical(node) {
  const children = []
  ts.forEachChild(node, child => { children.push(canonical(child)) })
  return [node.kind, ...(children.length ? children : [node.text ?? null])]
}
const hash = node => createHash('sha256').update(JSON.stringify(canonical(node))).digest('hex')

// Inline only the extracted commands to compare original page handlers. This
// keeps API/timer/error-reset orchestration checks independent of their wrappers.
function expand(block) {
  const result = ts.transform(block, [context => {
    function visit(node) {
      if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression) && ts.isIdentifier(node.expression.expression)) {
        const action = actions.get(node.expression.expression.text)
        if (action) {
          assert.deepEqual(node.expression.arguments.map(argument => argument.getText(page)), action.parameters.map(parameter => parameter.name.getText(flow)))
          return [...action.body.statements]
        }
      }
      return ts.visitEachChild(node, visit, context)
    }
    return visit
  }])
  const expanded = result.transformed[0]
  result.dispose()
  return expanded
}

for (const [name, expected] of Object.entries(baseline.states)) test(`${name}: same initial state, owned only by the flow hook`, () => {
  const state = declarations(hook.body).find(node => ts.isArrayBindingPattern(node.name) && node.name.elements[0].name.text === name)
  assert.ok(state, name)
  assert.equal(hash(state), expected)
  assert.ok(!declarations(main.body).some(node => ts.isArrayBindingPattern(node.name) && node.name.elements[0].name.text === name))
})

for (const [name, expected] of Object.entries(baseline.derived)) test(`${name}: original derived-state semantics`, () => {
  const declaration = declarations(hook.body).find(node => node.name.text === name)
  assert.ok(declaration, name)
  assert.equal(hash(declaration), expected)
})

const pageFunctions = new Map([...page.statements.filter(node => ts.isFunctionDeclaration(node) && node !== main), ...main.body.statements.filter(ts.isFunctionDeclaration)].map(node => [node.name.text, node]))
for (const [name, expected] of Object.entries(baseline.functions)) test(`${name}: original page behavior after expanding extracted commands`, () => {
  const declaration = pageFunctions.get(name) ?? (name === 'handleCategorySelect' ? actions.get('selectCategory') : undefined)
  assert.ok(declaration, name)
  assert.equal(hash(expand(declaration.body)), expected)
})

test('page JSX and effect/dependency order stay unchanged', () => {
  assert.equal(hash(main.body.statements.find(ts.isReturnStatement)), baseline.jsx)
  const effects = main.body.statements.flatMap(node => {
    const call = ts.isVariableStatement(node) ? node.declarationList.declarations[0]?.initializer : undefined
    if (call && ts.isCallExpression(call) && call.expression.getText(page) === 'useConsultationIntro') {
      // Expand the hook at its actual page call position. The only extra effect
      // dependency is the stable page setter, whose origin is checked separately.
      return introHook.body.statements.filter(statement => ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression) && statement.expression.expression.getText(intro) === 'useEffect').map(statement => {
        const effect = statement.expression
        const dependencies = effect.arguments[1]
        assert.deepEqual(dependencies.elements.map(item => item.getText(intro)), ['assistantMessage', 'submittedPrompt', 'setAssistantMessage'])
        return ts.factory.updateExpressionStatement(statement, ts.factory.updateCallExpression(effect, effect.expression, effect.typeArguments, [effect.arguments[0], ts.factory.createArrayLiteralExpression(dependencies.elements.slice(0, 2))]))
      })
    }
    return ts.isExpressionStatement(node) && ts.isCallExpression(node.expression) && ['useEffect', 'useLayoutEffect'].includes(node.expression.expression.getText(page)) ? [node] : []
  })
  assert.deepEqual(effects.map(hash), baseline.effects)
})

test('flow hook has no history, request, storage, timer, DOM, presentation or page dependency', () => {
  assert.deepEqual(flow.statements.filter(ts.isImportDeclaration).map(node => node.moduleSpecifier.text), [
    'react', '../model/consultation.types', '../model/consultationOptions',
    '../model/operatingHours.types', '../model/targetCustomerOptions', '../../location/location.types',
  ])
  assert.doesNotMatch(flow.text, /useEffect|useLayoutEffect|window\.|document\.|localStorage|setTimeout|AbortController|fetch\(/)
  assert.equal(declarations(main.body).filter(node => ts.isCallExpression(node.initializer) && node.initializer.expression.getText(page) === 'useConsultationFlow').length, 1)
})
