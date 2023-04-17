import path from 'path';
import { sync as globSync } from 'glob';

// 扫描 js/ts/jsx/tsx文件
export const scanFiles = (scanPath: string) => {
  const fileExt = ['js', 'jsx', 'ts', 'tsx'];

  const resArr: string[] = [];
  fileExt.forEach((ext) => {
    const res = globSync(path.join(process.cwd(), `${scanPath}/**/*.${ext}`));
    resArr.push(...res);
  });

  return resArr;
};
