import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve'; // 引用第三方包
import typescript from 'rollup-plugin-typescript2';
// import babel from 'rollup-plugin-babel';
import preserveShebang from 'rollup-plugin-preserve-shebang';

const inputArr = [
  {
    input: 'src/index.ts',
    main: 'dist/index.cjs.js',
    module: 'dist/index.esm.js',
  },
  {
    input: 'src/cli/index.ts',
    main: 'dist/cli.cjs.js',
    module: 'dist/cli.esm.js',
  },
];

const rollupConfig = inputArr.map(({ input, main, module }) => ({
  input,
  output: [
    {
      file: main,
      format: 'cjs',
      exports: 'named',
    },
    {
      file: module,
      format: 'es',
      exports: 'named',
    },
  ],
  plugins: [
    commonjs(),
    nodeResolve(),
    preserveShebang(),
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
}));

export default rollupConfig;
