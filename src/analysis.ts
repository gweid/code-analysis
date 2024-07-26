import tsCompiler from 'typescript';

import { scanNormalFiles } from './utils/file';
import { parseFiles } from './utils/parse';
import { CODEFILETYPE } from './constant';

import { defaultPlugin, methodPlugin, typePlugin } from './plugins';

import { IOptions, ITemp, IImportItems, IPropertyAccess } from './analysis.type';
import { AfterHookOpt, ICheckFunOpt, IPlugin, OriginalPlugin } from './plugins/types/common.type';

class CodeAnalysis {
  _scanSource: string[]; // 分析文件夹
  _analysisTarget: string; // 分析目标

  analysisMap: Record<string, any> = {}; // 分析信息

  pluginQueue: IPlugin[] = []; // 插件队列

  diagnosisInfos: any[] = []; // 诊断日志

  constructor(options: IOptions) {
    this._scanSource = options.scanSource;
    this._analysisTarget = options.analysisTarget;

    this.pluginQueue = [];

    this._installPlugin(options.plugins || []);
  }

  // 注册插件
  _installPlugin(plugins: OriginalPlugin[]) {
    if (plugins.length > 0) {
      plugins.forEach((plugin) => {
        this.pluginQueue.push(plugin(this));
      });
    }

    // 加载内置插件，为什么内置插件放在最后，主要用于兜底
    this.pluginQueue.push(methodPlugin(this));
    this.pluginQueue.push(typePlugin(this));
    // defaultPlugin 是插件队列中最后一个用于兜底的分析插件，因为分析工具最基础的分析指标是统计 API 调用信息，
    this.pluginQueue.push(defaultPlugin(this));
  }

  // 执行插件的 checkFun 函数
  _runPlugin({
    context,
    tsCompiler,
    node,
    depth,
    apiName,
    matchImportItem,
    filePath,
    projectName,
    httpRepo,
    line,
  }: ICheckFunOpt) {
    const len = this.pluginQueue.length;
    if (len) {
      for (let i = 0; i < len; i++) {
        const checkFun = this.pluginQueue[i].checkFun;

        const checkFunRes = checkFun({
          context,
          tsCompiler,
          node,
          depth,
          apiName,
          matchImportItem,
          filePath,
          projectName,
          httpRepo,
          line,
        });

        if (checkFunRes) {
          break;
        }
      }
    }
  }

  // 执行插件的 afterHook 函数
  _runPluginAfterHook({ importItems, ast, checker, filePath, projectName, httpRepo, line }: AfterHookOpt) {
    const len = this.pluginQueue.length;
    if (len) {
      for (let i = 0; i < len; i++) {
        const afterHook = this.pluginQueue[i].afterHook;
        if (afterHook && typeof afterHook === 'function') {
          afterHook({
            context: this,
            mapName: this.pluginQueue[i].mapName,
            importItems,
            ast,
            checker,
            filePath,
            projectName,
            httpRepo,
            line,
          });
        }
      }
    }
  }

  // 记录诊断日志
  addDiagnosisInfo(info: any) {
    this.diagnosisInfos.push(info);
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
        if (node.moduleSpecifier && node.moduleSpecifier.text && node.moduleSpecifier.text === this._analysisTarget) {
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
    ast: tsCompiler.SourceFile,
    checker: tsCompiler.TypeChecker,
    filePath: string,
    baseLine = 0,
  ) {
    const importItemNames = Object.keys(importItems); // 获取所有导入的 API 名称

    const walk = (node: tsCompiler.SourceFile | tsCompiler.Node) => {
      tsCompiler.forEachChild(node, walk);
      const line = ast.getLineAndCharacterOfPosition(node.getStart()).line + baseLine + 1;

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

                // 执行插件
                this._runPlugin({
                  context: this,
                  tsCompiler,
                  node: baseNode,
                  depth,
                  apiName,
                  matchImportItem,
                  filePath,
                  projectName: '',
                  httpRepo: '',
                  line,
                });
              }
            }
          }
        }
      }
    };

    walk(ast);

    // 执行插件的 AfterHook
    // this._runPluginAfterHook({
    //   context: this,
    //   importItems,
    //   ast,
    //   checker,
    //   filePath,
    //   projectName: '',
    //   httpRepo: '',
    //   line: baseLine
    // });
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
        apiName, // 链式调用 api 全路径
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
