import path from 'path';

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
      file: 'dist/index.esm.js',
      format: 'es',
    },
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
    }),
    // babel({
    //   extensions: ['.js', '.ts'],
    //   runtimeHelpers: true,
    //   exclude: 'node_modules/**', // 忽略 node_modules
    //   configFile: resolve('babel.config.js'),
    // }),
  ],
};
