import tsCompiler from 'typescript';

import { scanNormalFiles } from './utils/file';
import { parseFiles } from './utils/parse';
import { CODEFILETYPE } from './constant';

interface IOptions {
  scanSource: string[];
}

interface ITemp {
  name: string; // 导入后在代码中真实调用使用的 API 名
  origin: string | null; // API 别名。null则表示该非别名导入，name就是原本名字
  symbolPos: number; // symbol指向的声明节点在代码字符串中的起始位置
  symbolEnd: number; // symbol指向的声明节点在代码字符串中的结束位置
  identifierPos: number; // API 名字信息节点在代码字符串中的起始位置
  identifierEnd: number; // API 名字信息节点在代码字符串中的结束位置
  line: number; // 导入 API 的import语句所在代码行信息
}

class CodeAnalysis {
  _scanSource: string[];

  constructor(options: IOptions) {
    this._scanSource = options.scanSource;
  }

  // 根据配置文件中需要扫描的文件目录，返回文件目录合集
  _scanFiles(scanSource: string[], type: CODEFILETYPE) {
    const entry: string[] = [];
    scanSource.forEach((item) => {
      if (type === CODEFILETYPE.NORMAL) {
        const res = scanNormalFiles(item);
        entry.push(...res);
      }
    });
    return entry;
  }

  // 分析代码
  _scanCode(scanSource: string[], type: CODEFILETYPE) {
    const entry = this._scanFiles(scanSource, type);
    entry.forEach((filePath) => {
      const { ast } = parseFiles(filePath);
      const importItems = this._findImportItem(ast as tsCompiler.SourceFile, filePath);

      // if (Object.keys(importItems).length) {

      // }
    });
  }

  _findImportItem(ast: tsCompiler.SourceFile, filePath: string, baseLine = 0) {
    const that = this;
    const importItems: Record<string, ITemp> = {};

    // 用于记录导入的API及相关信息
    const dealImports = (temp: ITemp) => {
      const { name, origin, symbolPos, symbolEnd, identifierPos, identifierEnd, line } = temp;

      importItems[name] = {
        name,
        origin,
        symbolPos,
        symbolEnd,
        identifierPos,
        identifierEnd,
        line,
      };
    };

    // 遍历 ast
    const walk = (node: tsCompiler.SourceFile | tsCompiler.Node) => {
      tsCompiler.forEachChild(node, walk);
      const line = ast.getLineAndCharacterOfPosition(node.getStart()).line + baseLine + 1;
      if (tsCompiler.isImportDeclaration(node)) {
        // @ts-ignore
        if (node.moduleSpecifier && node.moduleSpecifier.text && node.moduleSpecifier.text === './utils') {
          const importClause = node.importClause;

          if (importClause) {
            // 处理 import utilsFunc from 'xxxx'
            if (importClause.name) {
              const temp = {
                name: importClause.name.escapedText as string,
                origin: null,
                symbolPos: importClause.pos,
                symbolEnd: importClause.end,
                identifierPos: importClause.name.pos,
                identifierEnd: importClause.name.end,
                line: line,
              };
              dealImports(temp);
            }

            const namedBindings = importClause.namedBindings;

            if (namedBindings) {
              // 处理 import * as utilsTool from 'xxxx'
              if (tsCompiler.isNamespaceImport(namedBindings) && namedBindings.name) {
                const temp = {
                  name: namedBindings.name.escapedText as string,
                  origin: '*',
                  symbolPos: namedBindings.pos,
                  symbolEnd: namedBindings.end,
                  identifierPos: namedBindings.name.pos,
                  identifierEnd: namedBindings.name.end,
                  line: line,
                };
                dealImports(temp);
              }

              /**
               * 处理
               * import { getFullName } from 'xxxx'
               * import { testFunc as getTest } from 'xxxx'
               */
              if (tsCompiler.isNamedImports(namedBindings)) {
                const eleList = namedBindings.elements;
                if (eleList && eleList.length > 0) {
                  eleList.forEach((ele) => {
                    if (tsCompiler.isImportSpecifier(ele)) {
                      const temp = {
                        name: ele.name.escapedText as string,
                        origin: '*',
                        symbolPos: ele.pos,
                        symbolEnd: ele.end,
                        identifierPos: ele.name.pos,
                        identifierEnd: ele.name.end,
                        line: line,
                      };
                      dealImports(temp);
                    }
                  });
                }
              }
            }
          }
        }
      }
    };

    walk(ast);

    return importItems;
  }

  // ast 分析
  // _dealAST(importItems: ITemp[], ast: tsCompiler.SourceFile, checker: tsCompiler.TypeChecker, filePath: string) {

  // }

  // 入口函数
  analysis() {
    this._scanCode(this._scanSource, CODEFILETYPE.NORMAL);
  }
}

export default CodeAnalysis;
