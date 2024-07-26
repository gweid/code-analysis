import tsCompiler from 'typescript';
import { CodeAnalysisInstance } from 'src/analysis';
import { ITemp } from 'src/analysis.type';

type TsCompilerType = typeof tsCompiler;

export interface ICheckFunOpt {
  context: CodeAnalysisInstance;
  tsCompiler: TsCompilerType;
  node: tsCompiler.Identifier | tsCompiler.PropertyAccessExpression;
  depth: number;
  apiName: string;
  matchImportItem: ITemp;
  filePath: string;
  projectName: string;
  httpRepo: string;
  line: number;
}

export type AfterHook = () => void;

export type OriginalPlugin = (analysisContext: CodeAnalysisInstance) => IPlugin;

export interface IPlugin {
  mapName: string;
  checkFun: (options: ICheckFunOpt) => boolean;
  afterHook: AfterHook | null;
}
