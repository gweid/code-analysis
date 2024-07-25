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
