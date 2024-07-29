module.exports = {
  env: {
    browser: true,
    es6: true,
    jest: false,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:promise/recommended',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  plugins: ['import', 'promise', '@typescript-eslint'],
  rules: {
    /**
     * eslint for ts规则
     * 注释中以‘CUSTOM’结尾的规则为可自定义规则（具体项目可自行调整）
     * 其余注释各业务方请不要随意配置，以规范为准
     * 以@typescript-eslint开头的规则由@typescript-eslint插件提供，用于检测ts
     *
     */

    // ============命名 && 声明变量=============
    camelcase: 0,
    'no-unused-vars': 0, // 禁止出现未使用过的变量（与typescript规则重复）
    'no-undef': 0, // 禁用未声明的变量，除非它们在 /*global */ 注释中被提到 （原因：全局变量较常用，定义在global.d.ts中即可）
    'prefer-const': 2, // 要求使用 const 声明那些声明后不再被修改的变量
    'one-var-declaration-per-line': 2, // 禁止一次性定义多个变量
    'no-inner-declarations': 1, // 禁止在嵌套的块中出现变量声明或 function 声明  --CUSTOM
    'no-useless-catch': 'off',

    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
      },
    ], // 整体命名风格, https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/naming-convention.md
    '@typescript-eslint/explicit-function-return-type': 0, // 对返回类型不明确的函数必须声明类型
    '@typescript-eslint/no-use-before-define': 0, // 在定义变量和函数之前禁止使用
    '@typescript-eslint/no-inferrable-types': 0, // 不允许对初始化为数字，字符串或布尔值的变量或参数进行显式类型声明
    '@typescript-eslint/ban-ts-comment': [
      'error',
      {
        'ts-ignore': false, // 允许使用 @ts-ignore
        'ts-nocheck': true,
        'ts-check': true,
        'ts-expect-error': true,
      },
    ],

    // ============空格 && 缩进=============
    indent: [
      2,
      2,
      {
        // 缩进
        FunctionDeclaration: {
          body: 1,
          parameters: 2,
        },
        SwitchCase: 1,
      },
    ],
    'eol-last': [1, 'always'], // 要求或禁止文件末尾存在空行
    'func-call-spacing': [2, 'never'], // 要求或禁止在函数标识符和其调用之间有空格
    'template-tag-spacing': 'off', // 和 styled-components 使用习惯不符合
    'spaced-comment': [
      2,
      'always',
      {
        // 要求或禁止在注释前有空白
        line: {
          markers: ['/'],
          exceptions: ['-', '+'],
        },
        block: {
          markers: ['!'],
          exceptions: ['*'],
          balanced: true,
        },
      },
    ],
    'key-spacing': [2, { afterColon: true }], // object的key的“:”之后至少有一个空格
    'space-infix-ops': 2, // 要求中缀操作符周围有空格
    'comma-spacing': [2, { after: true }], // 强制在逗号前后使用一致的空格
    'no-trailing-spaces': 2, // 禁用行尾空格
    'space-before-function-paren': 'off', //  正常情况下应该有一个空格，但是在 async 匿名函数下就会很奇怪，而且会和 prettier 冲突
    'no-multi-spaces': 2, // 禁止使用多个空格
    'object-curly-spacing': [2, 'always'], // 对象大括号旁必须有空格
    '@typescript-eslint/type-annotation-spacing': 'off', // 类型后面必须没有空格，不符合习惯,
    'no-unexpected-multiline': 2, // 禁止不期待的多行写法
    'operator-linebreak': [2, 'after', { overrides: { '?': 'before', ':': 'before' } }], // 过长需换行时操作符的位置  --CUSTOM

    // ============符号相关=============
    'comma-style': [2, 'last'], // 逗号规则
    'comma-dangle': [
      2,
      {
        // 行末尾必须有逗号
        functions: 'always-multiline',
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
      },
    ],
    'semi-style': [2, 'last'], // 强制分号的位置
    semi: [2, 'always'], // 语句必须分号结尾
    quotes: [2, 'single'], // 字符串必须使用单引号
    '@typescript-eslint/member-delimiter-style': [
      2,
      {
        // interface, type内的成员末尾必须使用统一符号（逗号）
        multiline: {
          delimiter: 'semi',
          requireLast: true,
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false,
        },
      },
    ],
    eqeqeq: [2, 'smart'], // 强制使用三等，除了对比null/undefined  --CUSTOM
    'no-extra-parens': 0, // 禁止不必要的括号 (as any写法会被误判)

    // ============箭头函数相关=============
    'arrow-parens': 2, // 要求箭头函数的参数使用圆括号
    'no-confusing-arrow': [2, { allowParens: true }], // 禁止在可能与比较操作符相混淆的地方使用箭头函数
    'arrow-spacing': [2, { before: true, after: true }],
    'arrow-body-style': [2, 'as-needed'], // 要求箭头函数体使用大括号

    // ============Promise相关=============
    'promise/no-return-wrap': 1, // 避免在不需要时将值包在Promise.resolve或Promise.reject中  --CUSTOM
    'promise/always-return': 0, // promise.then必须return
    'promise/no-callback-in-promise': 1, // promise.then中禁止使用回调函数

    // ============Import相关=============
    'import/order': 2, // import引入按照一定顺序
    'import/no-default-export': 'off', // 规则是好规则，但是某些场景下必须使用 export default，例如现在的路由插件，必须 export default
    'import/no-unresolved': 'off', // 和模块解析有关，如果本地文件中没有这个文件，则会报错，webpack 会省略后缀，并不适合

    // ============其他=============
    'require-atomic-updates': 1, // 禁止由于 await 或 yield的使用而可能导致出现竞态条件的赋值  --CUSTOM
    'no-case-declarations': 1, // 不允许在 case 子句中使用词法声明  --CUSTOM
    'prefer-rest-params': 0, // 要求使用剩余参数而不是 arguments  --CUSTOM
    'prefer-template': 1, // 要求使用模板字面量而非字符串连接  --CUSTOM
    'no-constant-condition': 0, // 禁止在条件中使用常量表达式
    'prefer-spread': 0, // 要求使用扩展运算符而非 .apply()
    'no-useless-escape': 0, // 禁用不必要的转义字符 (意义不大)
    'dot-notation': 0, // object操作要求使用点号 (意义不大)
    'require-await': 'error', // async 函数里面必须要有 await 关键字
    'generator-star-spacing': ['warn', 'after'], // generator 函数 * 必须在后面
    'yield-star-spacing': ['warn', 'after'], // generator 函数 yield 关键字后面必须有空格
    '@typescript-eslint/consistent-type-assertions': 1, // 强制规范类型定义的方式  --CUSTOM
    '@typescript-eslint/no-this-alias': 1, // 禁止对this使用别名  --CUSTOM
    '@typescript-eslint/no-namespace': 1, // 禁止使用自定义TypeScript模块和名称空间  --CUSTOM
    '@typescript-eslint/no-unused-vars': [
      1, // 禁止使用未使用的变量  --CUSTOM
      {
        vars: 'all',
        args: 'all',
        ignoreRestSiblings: true,
      },
    ],
    '@typescript-eslint/no-var-requires': 0, // 禁止var foo = require("foo"）用import代替
    '@typescript-eslint/no-non-null-assertion': 0, // 禁止使用!的非null断言后缀运算符
    '@typescript-eslint/no-explicit-any': 0, // 禁止使用any类型
    '@typescript-eslint/no-angle-bracket-type-assertion': 0, // 禁止使用尖括号范型
  },
  overrides: [
    // 为.js文件设置覆盖规则
    {
      files: ['./**/*.js'],
      rules: {
        'no-var': 0,
      },
    },
  ],
};
