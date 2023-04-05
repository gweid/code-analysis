const tsCompiler = require('typescript')

const codeStr = `
import { app } from 'framework';

const dataLen = 3;
let name = 'iceman';

if(app){
    console.log(name);
}

function getInfos (info: string) {
    const result = app.get(info);
    return result;
}
`

const ast = tsCompiler.createSourceFile('xxx', codeStr, tsCompiler.ScriptTarget.Latest, true)

// console.log(ast)

const apiMap = {}

function walk(node) {
  tsCompiler.forEachChild(node, walk)

  const line = ast.getLineAndCharacterOfPosition(node.getStart()).line

  if (tsCompiler.isStringLiteral(node) && node.text === 'iceman') {
    console.log(node.text)
  }

  if (tsCompiler.isIdentifier(node) && node.escapedText === 'app') {
    // 排除第一行通过 import 引入的
    if (line === 1) return

    if (node.escapedText in apiMap) {
      apiMap[node.escapedText].callNum++
      apiMap[node.escapedText].callLines.push(line)
    } else {
      apiMap[node.escapedText] = {}
      apiMap[node.escapedText].callNum = 1
      apiMap[node.escapedText].callLines = []
      apiMap[node.escapedText].callLines.push(line)
    }
  }
}

walk(ast)

console.log(apiMap)
