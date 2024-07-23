import tsCompiler from 'typescript';

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
