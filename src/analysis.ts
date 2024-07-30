import tsCompiler from 'typescript';

import { scanNormalFiles, scanVueFiles } from './utils/file';
import { parseFiles, parseVue } from './utils/parse';
import { CODEFILETYPE } from './constant';

import { defaultPlugin, methodPlugin, typePlugin, browserPlugin, defaultScorePlugin } from './plugins';

import { IAnalysisOptions, ITemp, IImportItems, IPropertyAccess, ScorePlugin } from './analysis.type';
import {
  AfterHookOpt,
  IBroswerPlugin,
  ICheckFunBroswerOpt,
  ICheckFunOpt,
  IPlugin,
  OriginalPlugin,
} from './plugins/analysisPlugins/types/common.type';
import { DefaultScorePluginReturn } from './plugins/scorePlugins/score.type';

class CodeAnalysis {
  _scanSource: string[]; // 分析文件夹
  _analysisTarget: string; // 分析目标
  _browserApis: string[]; // 浏览器 API
  _isScanVue: boolean; // 是否开启 vue 文件扫描
  _blackList: string[]; // 黑名单 API
  _scorePlugin: ScorePlugin;

  pluginQueue: IPlugin[] = []; // 插件队列
  broswerPluginQueue: IBroswerPlugin[] = []; // 浏览器插件队列

  importItemMap: Record<string, any> = {}; //

  analysisMap: Record<string, Record<string, any>> = {}; // 收集的分析数据
  scoreMap: DefaultScorePluginReturn = null;

  diagnosisInfos: any[] = []; // 诊断日志

  constructor(options: IAnalysisOptions) {
    const {
      scanSource,
      analysisTarget,
      browserApis = [],
      plugins = [],
      isScanVue = false,
      blackList = [],
      scorePlugin = null,
    } = options;

    this._scanSource = scanSource;
    this._analysisTarget = analysisTarget;
    this._browserApis = browserApis;
    this._isScanVue = isScanVue;
    this._blackList = blackList;
    this._scorePlugin = scorePlugin;

    this.pluginQueue = [];
    this.broswerPluginQueue = [];

    this.importItemMap = {};

    this._installPlugin(plugins || []);
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

    // 如果需要分析浏览器 API，那么需要注册浏览器分析插件
    if (this._browserApis.length) {
      this.broswerPluginQueue.push(browserPlugin(this));
    }
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

  // 浏览器插件执行，单独处理
  _runBroswerPlugin({
    context,
    tsCompiler,
    node,
    depth,
    apiName,
    filePath,
    projectName,
    httpRepo,
    line,
  }: ICheckFunBroswerOpt) {
    const len = this.broswerPluginQueue.length;

    if (len) {
      for (let i = 0; i < len; i++) {
        const checkFun = this.broswerPluginQueue[i].checkFun;

        const checkFunRes = checkFun({
          context,
          tsCompiler,
          node,
          depth,
          apiName,
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

  // 记录诊断日志
  addDiagnosisInfo(info: any) {
    this.diagnosisInfos.push(info);
  }

  // 根据配置文件中需要扫描的文件目录，返回文件目录合集
  _scanFiles(scanSource: string[], type: CODEFILETYPE) {
    const entry: string[] = [];

    scanSource.forEach((item) => {
      if (type === CODEFILETYPE.NORMAL) {
        const normalFiles = scanNormalFiles(item);
        entry.push(...normalFiles);
      } else if (type === CODEFILETYPE.VUE) {
        const vueFiles = scanVueFiles(item);
        entry.push(...vueFiles);
      }
    });

    return entry;
  }

  // 分析代码
  _scanCode(scanSource: string[], type: CODEFILETYPE) {
    // 1、扫描所有需要分析的代码文件，得到文件路径合集
    const entry = this._scanFiles(scanSource, type);

    entry.forEach((filePath) => {
      try {
        if (type === CODEFILETYPE.NORMAL) {
          // 2、代码文件解析为 AST
          const { ast, checker } = parseFiles(filePath);

          // 3、遍历 AST 搜集 import 节点信息
          const importItems = this._findImportItem(ast as tsCompiler.SourceFile, filePath);

          // 4、遍历 AST ，对比收集到的 import 节点信息，分析 API 调用
          // 同时，这里如果要检测所有文件的浏览器 API，那么需要判断 this._browserApis.length 放行
          if (Object.keys(importItems).length || this._browserApis.length) {
            this._dealAST(importItems, ast as tsCompiler.SourceFile, checker, filePath);
          }
        }

        // vue 文件的处理
        if (type === CODEFILETYPE.VUE) {
          const { ast, checker } = parseVue(filePath);
          const importItems = this._findImportItem(ast as tsCompiler.SourceFile, filePath);
          if (Object.keys(importItems).length || this._browserApis.length) {
            this._dealAST(importItems, ast as tsCompiler.SourceFile, checker, filePath);
          }
        }
      } catch (error) {
        throw error;
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

      if (!that.importItemMap[name]) {
        that.importItemMap[name] = {};
        that.importItemMap[name].callOrigin = origin;
        that.importItemMap[name].callFiles = [];
        that.importItemMap[name].callFiles.push(filePath);
      } else {
        that.importItemMap[name].callFiles.push(filePath);
      }
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

      // 处理全局 API
      // 全局 api 的特点就是 pos、end 值特别大，即它们的值在代码字符总长度之外
      if (tsCompiler.isIdentifier(node) && node.escapedText && this._browserApis.includes(node.escapedText)) {
        const symbol = checker.getSymbolAtLocation(node);

        if (symbol && symbol.declarations) {
          if (
            (symbol.declarations.length === 1 && symbol.declarations[0].pos > ast.end) ||
            symbol.declarations.length > 1
          ) {
            const { baseNode, depth, apiName } = this._checkPropertyAccess(node);

            // 执行浏览器 API 分析插件
            this._runBroswerPlugin({
              context: this,
              tsCompiler,
              node: baseNode,
              depth,
              apiName,
              filePath,
              projectName: '',
              httpRepo: '',
              line,
            });
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

  // 将 API 黑名单标记，记号为: isBlack
  _blackTag() {
    // 没配置需要检测的黑名单 API，不需要继续执行
    if (!this._blackList.length) return;

    Object.keys(this.analysisMap).forEach((item) => {
      Object.keys(this.analysisMap[item]).forEach((apiName) => {
        if (this._blackList.includes(apiName)) {
          this.analysisMap[item][apiName].isBlack = true;
        }
      });
    });
  }

  // 入口函数
  analysis() {
    // 分析 vue 文件
    if (this._isScanVue) {
      this._scanCode(this._scanSource, CODEFILETYPE.VUE);
    }

    // 分析其它文件
    this._scanCode(this._scanSource, CODEFILETYPE.NORMAL);

    // 黑名单标记
    this._blackTag();

    // 进行数据整理、评分
    if (typeof this._scorePlugin === 'function') {
      this.scoreMap = this._scorePlugin(this);
    } else if (this._scorePlugin === 'default') {
      this.scoreMap = defaultScorePlugin(this);
    }
  }
}

export type CodeAnalysisInstance = InstanceType<typeof CodeAnalysis>;

export default CodeAnalysis;
