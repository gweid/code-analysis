import tsCompiler from 'typescript';

import { scanNormalFiles } from './utils/file';
import { parseFiles } from './utils/parse';
import { CODEFILETYPE } from './constant';

import defaultPlugin from './plugins/defaultPlugin';

import { IOptions, ITemp, IImportItems, IPropertyAccess } from './analysis.type';

class CodeAnalysis {
  _scanSource: string[];
  apiMap: Record<string, any> = {};

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
    // 1、扫描所有需要分析的代码文件，得到文件路径合集
    const entry = this._scanFiles(scanSource, type);

    entry.forEach((filePath) => {
      // 2、代码文件解析为 AST
      const { ast, checker } = parseFiles(filePath);

      // 3、遍历 AST 搜集 import 节点信息
      const importItems = this._findImportItem(ast as tsCompiler.SourceFile, filePath);

      // 4、遍历 AST ，对比收集到的 import 节点信息，分析 API 调用
      if (Object.keys(importItems).length) {
        this._dealAST(importItems, ast as tsCompiler.SourceFile, checker, filePath);
      }
    });
  }

  // 收集节点信息
  _findImportItem(ast: tsCompiler.SourceFile, filePath: string, baseLine = 0) {
    const that = this;
    const importItems: IImportItems = {};

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
            // 处理 import yyyy from 'xxxx'
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
              // 处理 import * as yyyy from 'xxxx'
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
               * import { yyyy } from 'xxxx'
               * import { yyyy as kkkk } from 'xxxx'
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
  _dealAST(
    importItems: IImportItems,
    ast: tsCompiler.SourceFile | tsCompiler.Node,
    checker: tsCompiler.TypeChecker,
    filePath: string,
  ) {
    const importItemNames = Object.keys(importItems); // 获取所有导入的 API 名称

    const walk = (node: tsCompiler.SourceFile | tsCompiler.Node) => {
      tsCompiler.forEachChild(node, walk);

      // 判定当前遍历的节点是否为 isIdentifier 类型节点
      // 判断从 Import 导入的 API 中是否存在与当前遍历节点名称相同的 API，这样就可以过滤掉那些不需要分析的
      if (tsCompiler.isIdentifier(node) && node.escapedText && importItemNames.includes(node.escapedText)) {
        const matchImportItem = importItems[node.escapedText];

        // 这一步，主要是排除引入，比如 import yyyy from 'xxxx'，主要是要统计 API 调用，引入可以忽略
        if (node.pos !== matchImportItem.identifierPos && node.end !== matchImportItem.identifierEnd) {
          // 找到 symbolPos 与 symbolEnd 一致的节点
          const symbol = checker.getSymbolAtLocation(node);
          if (symbol && symbol.declarations && symbol.declarations.length) {
            const nodeSymbol = symbol.declarations[0];
            if (nodeSymbol.pos === matchImportItem.symbolPos && nodeSymbol.end === matchImportItem.symbolEnd) {
              if (node.parent) {
                // 获取基础分析节点信息
                const { baseNode, depth, apiName } = this._checkPropertyAccess(node);

                // API调用信息统计
                defaultPlugin().checkFun({
                  context: this,
                  tsCompiler,
                  node: baseNode,
                  depth,
                  apiName,
                  matchImportItem,
                  filePath,
                  projectName: '',
                  httpRepo: '',
                  line: 0,
                });
              }
            }
          }
        }
      }
    };

    walk(ast);
  }

  // 链式调用检查，找出链路顶点 node
  _checkPropertyAccess(
    node: tsCompiler.Identifier | tsCompiler.PropertyAccessExpression,
    index = 0,
    apiName = '',
  ): IPropertyAccess {
    if (index > 0 && tsCompiler.isPropertyAccessExpression(node)) {
      apiName = `${apiName}.${node.name.escapedText}`;
    } else if (tsCompiler.isIdentifier(node)) {
      apiName = `${node.escapedText}`;
    }

    if (tsCompiler.isPropertyAccessExpression(node.parent)) {
      index++;
      return this._checkPropertyAccess(node.parent, index, apiName);
    } else {
      return {
        baseNode: node, // 原始的 api
        depth: index, // 调用了几层
        apiName: apiName, // 链式调用 api 全路径
      };
    }
  }

  // 入口函数
  analysis() {
    this._scanCode(this._scanSource, CODEFILETYPE.NORMAL);
  }
}

export type CodeAnalysisInstance = InstanceType<typeof CodeAnalysis>;

export default CodeAnalysis;
