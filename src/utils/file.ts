import fs from 'fs';
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

// 扫描 vue 文件，返回文件路径合集
export const scanVueFiles = (scanPath: string) => {
  const res = globSync(path.join(process.cwd(), `${scanPath}/**/*.vue`));

  return res || [];
};

// 读取文件，得到里面的代码内容
export const getFileCode = (fileName: string) => {
  try {
    const code = fs.readFileSync(fileName, 'utf-8');
    return code;
  } catch (error) {
    throw error;
  }
};

// 写入文件
export const writeFile = (content: string, fileName: string) => {
  try {
    fs.writeFileSync(path.join(process.cwd(), `${fileName}`), content, 'utf8');
  } catch (error) {
    throw error;
  }
};
