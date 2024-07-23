import path from 'path';
import { sync as globSync } from 'glob';

// 扫描 js/ts/jsx/tsx 文件，返回文件路径合集
export const scanNormalFiles = (scanPath: string) => {
  const fileExt = ['js', 'jsx', 'ts', 'tsx'];

  const resArr: string[] = [];
  fileExt.forEach((ext) => {
    const res = globSync(path.join(process.cwd(), path.normalize(`${scanPath}/**/*.${ext}`)));
    resArr.push(...res);
  });

  return resArr;
};
