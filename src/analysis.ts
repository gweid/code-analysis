import tsCompiler from 'typescript';

import { scanNormalFiles } from './utils/file';
import { parseFiles } from './utils/parse';
import { CODEFILETYPE } from './constant';

interface ICodeAnalysis {
  _scanSource: string[];
  _scanFiles(scanSource: string[], type: CODEFILETYPE): any[];
  _scanCode(scanSource: string[], type: CODEFILETYPE): void;
  _findImportItem(ast: tsCompiler.Node, filePath: string, baseLine?: number): void;
}

interface IOptions {
  scanSource: string[];
}

class CodeAnalysis implements ICodeAnalysis {
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
      const { ast, checker } = parseFiles(filePath);
      this._findImportItem(ast as tsCompiler.SourceFile, filePath);
    });
  }

  _findImportItem(ast: tsCompiler.SourceFile, filePath: string, baseLine = 0) {
    // 遍历 ast
    const walk = (node: tsCompiler.SourceFile | tsCompiler.Node) => {
      tsCompiler.forEachChild(node, walk);
      const line = ast.getLineAndCharacterOfPosition(node.getStart()).line + baseLine + 1;
      if (tsCompiler.isImportDeclaration(node)) {
        // console.log(node);
      }
    };

    walk(ast);
  }

  // 入口函数
  analysis() {
    this._scanCode(this._scanSource, CODEFILETYPE.NORMAL);
  }
}

export default CodeAnalysis;
