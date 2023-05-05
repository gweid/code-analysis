import tsCompiler from 'typescript';

// import { scanNormalFiles } from './utils/file';
// import { parseFiles } from './utils/parse';
import { CODEFILETYPE } from './constant';

interface ICodeAnalysis {
  _scanSource: string;
  _scanFiles(scanSource: IScanSourceItem[], type: CODEFILETYPE): any[];
  _scanCode(scanSource: IScanSourceItem[], type: CODEFILETYPE): void;
  _findImportItem(ast: tsCompiler.Node, filePath: string, baseLine?: number): void;
}

interface IOptions {
  scanSource: string;
}

interface IScanSourceItem {
  name: string;
  httpRepo: string;
  path: string;
  format?: any;
}

class CodeAnalysis implements ICodeAnalysis {
  _scanSource: string;

  constructor(options: IOptions) {
    this._scanSource = options.scanSource;
  }

  _scanFiles(scanSource: IScanSourceItem[], type: CODEFILETYPE) {
    const entry: any[] = [];
    scanSource.forEach((item) => {
      if (type === CODEFILETYPE.NORMAL) {
        console.log(item);
      }
    });
    return entry;
  }

  _scanCode(scanSource: IScanSourceItem[], type: CODEFILETYPE) {
    const entry = this._scanFiles(scanSource, type);
    entry.forEach((item) => {
      console.log(item);
    });
  }

  _findImportItem(ast: tsCompiler.SourceFile, filePath: string, baseLine = 0) {
    // 遍历 ast
    const walk = (node: tsCompiler.SourceFile | tsCompiler.Node) => {
      tsCompiler.forEachChild(node, walk);
      const line = ast.getLineAndCharacterOfPosition(node.getStart()).line + baseLine + 1;

      if (tsCompiler.isImportDeclaration(node)) {
        console.log(node);
      }
    };
  }
}

export default CodeAnalysis;
