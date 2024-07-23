import path from 'path';

import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve'; // 引用第三方包
import typescript from 'rollup-plugin-typescript2';
// import babel from 'rollup-plugin-babel';

import pkg from './package.json';

const resolve = (...args) => path.resolve(__dirname, ...args);

export default {
  input: 'src/index.ts',
  output: [
    {
      file: resolve(pkg.main),
      format: 'cjs',
      exports: 'named',
    },
    {
      file: resolve(pkg.module),
      format: 'es',
      exports: 'named',
    },
  ],
  plugins: [
    commonjs(),
    nodeResolve(),
    typescript({
      tsconfig: './tsconfig.json',
      clean: true,
    }),
    // babel({
    //   extensions: ['.js', '.ts'],
    //   runtimeHelpers: true,
    //   exclude: 'node_modules/**', // 忽略 node_modules
    //   configFile: resolve('babel.config.js'),
    // }),
  ],
  watch: {
    include: 'src/**', // 监听 src 目录下的所有文件
    exclude: 'node_modules/**', // 排除 node_modules 目录
  },
};
