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
const analysis = parse('src/features/analysis/hooks/useAnalysisReport.ts')
const analysisHook = analysis.statements.find(node => node.name?.text === 'useAnalysisReport')
const analysisFunctions = new Map(analysisHook.body.statements.filter(ts.isFunctionDeclaration).map(node => [node.name.text, node]))
const schedule = analysisHook.body.statements.filter(ts.isVariableStatement).flatMap(node => [...node.declarationList.declarations]).find(node => node.name.text === 'scheduleAnalysisLoading').initializer
const main = page.statements.find(node => node.name?.text === 'AiHomePage')
const hook = flow.statements.find(node => node.name?.text === 'useConsultationFlow')
const declarations = block => block.statements.filter(ts.isVariableStatement).flatMap(node => [...node.declarationList.declarations])
const actions = new Map(hook.body.statements.filter(ts.isFunctionDeclaration).map(node => [node.name.text, node]))
actions.set('cancelIntro', introHook.body.statements.find(node => node.name?.text === 'cancelIntro'))
for (const name of ['cancelAnalysisReport', 'resetAnalysisReportState', 'clearAnalysisReportError', 'deleteReport', 'downloadAnalysisReport']) actions.set(name, analysisFunctions.get(name))
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
      if (ts.isIdentifier(node) && node.text === 'userId') return ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('user'), 'id')
      if (ts.isIdentifier(node) && node.text === 'initialLoadingDelay') return ts.factory.createIdentifier('ASSISTANT_RESPONSE_LOADING_DELAY')
      if (ts.isReturnStatement(node) && node.expression && ts.isCallExpression(node.expression) && ts.isIdentifier(node.expression.expression) && node.expression.expression.text === 'scheduleAnalysisLoading') {
        assert.equal(node.expression.arguments.length, 0)
        assert.equal(schedule.expression.getText(analysis), 'useCallback')
        assert.equal(schedule.arguments[1].elements.length, 0)
        return [...schedule.arguments[0].body.statements]
      }
      if (ts.isExpressionStatement(node) && ts.isAwaitExpression(node.expression) && ts.isCallExpression(node.expression.expression) && node.expression.expression.expression.getText(page) === 'submitAnalysisReport') {
        const [builder, confirm, clear] = node.expression.expression.arguments
        assert.ok(ts.isArrowFunction(builder) && builder.parameters.length === 0 && ts.isParenthesizedExpression(builder.body))
        assert.equal(confirm.getText(page), 'confirmSummary')
        assert.equal(clear.getText(page), 'clearSummaryConfirmation')
        const replacePayload = ts.transform(analysisFunctions.get('submitAnalysisReport').body, [ctx => {
          const replace = child => ts.isCallExpression(child) && ts.isIdentifier(child.expression) && child.expression.text === 'buildRequest'
            ? builder.body.expression : ts.visitEachChild(child, replace, ctx)
          return replace
        }])
        const expanded = visit(replacePayload.transformed[0])
        replacePayload.dispose()
        return [...expanded.statements]
      }
      if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression) && ts.isIdentifier(node.expression.expression)) {
        const action = actions.get(node.expression.expression.text)
        if (action) {
          assert.deepEqual(node.expression.arguments.map(argument => argument.getText()), action.parameters.map(parameter => parameter.name.getText()))
          return [...visit(action.body).statements]
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
  const declaration = pageFunctions.get(name) ?? analysisFunctions.get(name) ?? (name === 'handleCategorySelect' ? actions.get('selectCategory') : undefined)
  assert.ok(declaration, name)
  assert.equal(hash(expand(declaration.body)), expected)
})

test('page JSX, unmoved effects and extracted report effects preserve their behavior', () => {
  assert.equal(hash(main.body.statements.find(ts.isReturnStatement)), baseline.jsx)
  const effects = main.body.statements.flatMap(node => {
    const call = ts.isVariableStatement(node) ? node.declarationList.declarations[0]?.initializer : undefined
    if (call && ts.isCallExpression(call) && call.expression.getText(page) === 'useAnalysisReport') {
      assert.equal(call.arguments.length, 1)
      assert.deepEqual(call.arguments[0].properties.map(arg => arg.getText(page)), ['userId: user.id', 'activeSessionId', 'initialLoadingDelay: ASSISTANT_RESPONSE_LOADING_DELAY'])
      const moved = analysisHook.body.statements.filter(statement => ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression) && statement.expression.expression.getText(analysis) === 'useEffect')
      assert.equal(moved.length, 2)
      // PDF restoration moves earlier with the hook. Its asynchronous body,
      // cleanup guard and dependencies must still match the original effect.
      assert.equal(hash(expand(moved[1])), baseline.effects.at(-1))
      return [moved[0]]
    }
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
    if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression) && ['useEffect', 'useLayoutEffect'].includes(node.expression.expression.getText(page))) {
      if (node.getText(page).includes('scheduleAnalysisLoading()')) {
        const effect = node.expression
        assert.deepEqual(effect.arguments[1].elements.map(item => item.getText(page)), ['analysisProgressStage', 'analysisProgressTypewriter.isComplete', 'scheduleAnalysisLoading'])
        return [expand(ts.factory.updateExpressionStatement(node, ts.factory.updateCallExpression(effect, effect.expression, effect.typeArguments, [effect.arguments[0], ts.factory.createArrayLiteralExpression(effect.arguments[1].elements.slice(0, 2))])))]
      }
      return [node]
    }
    return []
  })
  assert.deepEqual(effects.map(hash), baseline.effects.slice(0, -1))
})

test('flow hook has no history, request, storage, timer, DOM, presentation or page dependency', () => {
  assert.deepEqual(flow.statements.filter(ts.isImportDeclaration).map(node => node.moduleSpecifier.text), [
    'react', '../model/consultation.types', '../model/consultationOptions',
    '../model/operatingHours.types', '../model/targetCustomerOptions', '../../location/location.types',
  ])
  assert.doesNotMatch(flow.text, /useEffect|useLayoutEffect|window\.|document\.|localStorage|setTimeout|AbortController|fetch\(/)
  assert.equal(declarations(main.body).filter(node => ts.isCallExpression(node.initializer) && node.initializer.expression.getText(page) === 'useConsultationFlow').length, 1)
})
