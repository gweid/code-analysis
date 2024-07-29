import tsCompiler from 'typescript';
import { OriginalPlugin } from './plugins/types/common.type';

export interface IOptions {
  scanSource: string[];
  analysisTarget: string;
  browserApis: string[];
  plugins?: OriginalPlugin[];
  isScanVue?: boolean;
}

export interface ITemp {
  name: string; // 导入后在代码中真实调用使用的 API 名
  origin: string | null; // API 别名。null 则表示该非别名导入，name 就是原本名字
  symbolPos: number; // symbol 指向的声明节点在代码字符串中的起始位置
  symbolEnd: number; // symbol 指向的声明节点在代码字符串中的结束位置
  identifierPos: number; // API 名字信息节点在代码字符串中的起始位置
  identifierEnd: number; // API 名字信息节点在代码字符串中的结束位置
  line: number; // 导入 API 的 import 语句所在代码行信息
}

export type IImportItems = Record<string, ITemp>;

export interface IPropertyAccess {
  baseNode: tsCompiler.Identifier | tsCompiler.PropertyAccessExpression;
  depth: number;
  apiName: string;
}
