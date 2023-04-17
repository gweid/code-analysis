import { scanFiles } from './file';

interface ICodeAnalysis {
  _scanSource: string;
  _scanFiles(scanSource: string): string[];
}

interface IOptions {
  scanSource: string;
}

class CodeAnalysis implements ICodeAnalysis {
  _scanSource: string;

  constructor(options: IOptions) {
    this._scanSource = options.scanSource;
  }

  _scanFiles(scanSource: string) {
    return scanFiles(scanSource);
  }
}

export default CodeAnalysis;
