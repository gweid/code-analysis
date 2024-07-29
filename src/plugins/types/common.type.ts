import tsCompiler from 'typescript';
import { CodeAnalysisInstance } from 'src/analysis';
import { IImportItems, ITemp } from 'src/analysis.type';

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

export interface ICheckFunBroswerOpt {
  context: CodeAnalysisInstance;
  tsCompiler: TsCompilerType;
  node: tsCompiler.Identifier | tsCompiler.PropertyAccessExpression;
  depth: number;
  apiName: string;
  filePath: string;
  projectName: string;
  httpRepo: string;
  line: number;
}

export interface AfterHookOpt {
  context: CodeAnalysisInstance;
  mapName?: string;
  importItems?: IImportItems;
  ast: tsCompiler.SourceFile | undefined;
  checker: tsCompiler.TypeChecker;
  filePath: string;
  projectName: string;
  httpRepo: string;
  line: number;
}

export type AfterHook = (option: AfterHookOpt) => void;

export type OriginalPlugin = (analysisContext: CodeAnalysisInstance) => IPlugin;

export interface IPlugin {
  mapName: string;
  checkFun: (options: ICheckFunOpt) => boolean;
  afterHook: AfterHook | null;
}

export interface IBroswerPlugin {
  mapName: string;
  checkFun: (options: ICheckFunBroswerOpt) => boolean;
  afterHook: AfterHook | null;
}
