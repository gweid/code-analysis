import path from 'path';
import JsMD5 from 'js-md5';
import tsCompiler from 'typescript';
import vueCompiler from '@vue/compiler-dom';

import { VUETEMPTSDIR } from '../constant';
import { getFileCode, writeFile } from './file';

// 读取代码，解析成 ast
export const parseFiles = (fileName: string) => {
  // 创建 Program
  // fileNames 参数表示文件路径列表，是一个数组，可以只传 1 个文件
  // options 参数是编译选项，可以理解成 tsconfig
  const program = tsCompiler.createProgram([fileName], {});

  // 从 Program 中获取 SourceFile 即 AST 对象
  // fileName 表示某一个文件路径
  const ast = program.getSourceFile(fileName);

  // 获取 TypeChecker 控制器
  const checker = program.getTypeChecker();

  return { ast, checker };
};

// 将 vue 文件代码转成 ast
export const parseVue = (fileName: string) => {
  // 获取 vue 文件代码
  const code = getFileCode(fileName);
  // 将 vue 代码转成 ast
  const res = vueCompiler.parse(code);

  const children = res.children;
  let tsCode = '';
  let baseLine = 0;

  children.forEach((ele) => {
    // @ts-ignore
    if (ele.tag === 'script') {
      // @ts-ignore
      tsCode = ele[0].content;
      // @ts-ignore
      baseLine = ele.loc.start.line - 1;
    }
  });

  const hashName = JsMD5.md5(fileName);
  const filePath = `${VUETEMPTSDIR}/${hashName}.ts`;
  writeFile(tsCode, filePath);

  const vueTempName = path.join(process.cwd(), `${filePath}`);

  const program = tsCompiler.createProgram([vueTempName], {});
  const ast = program.getSourceFile(vueTempName);
  const checker = program.getTypeChecker();

  return { ast, checker, baseLine };
};
