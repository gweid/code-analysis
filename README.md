## 代码分析



### 基本功能

1. 根据传入配置，扫描出需要检测的目录下的所有符合的文件，整理到文件合集
2. 遍历文件合集，将每一份文件代码转换成 AST
3. 遍历 AST，找到所有的 import 导入
4. 遍历 AST，对比收集到的 import 节点信息，分析 API 调用
5. 收集分析非 import 导入的全局 API，如（window、document）
6. 改造为插件式架构，将 API 分析，抽离成插件
   - 设计插件
   - 插件注册
   - 插件执行
7. 分析不是 import 导入的 API，比如全局 API
8. 处理 VUE 项目
   - @vue/compiler-dom 转换 vue 文件拿到 script 部分代码
   - 将 script 部分代码进行 ast 处理
9. 对收集到的 API 信息，进行整理
   - 代码评分
   - 代码告警
   - 脏调用检测
10. 生成分析报告
   - 实例化代码分析基础类，执行代码分析，生成分析报告
   - 分析报告可视化（html 页面形式展示）
11. 打包成 npm 包，发布
   - API 形式（方便集成到各个系统，例如：CI/CD、GitHook 等）
   - CLI 形式
12. 支持第三方分析插件，集成到分析项目中
   - 第三方插件开发、调试、发布
   - 建立公共的三方插件库
13. 接入到流水线 CI 中
   - 集成到 CI 实现分析及拦截
   - 推送告警及分析报告（分析报告，可以托管在 GitLab Pages）
   - 实现 CI 定时任务（GitLab CI 可以创建定时任务）
14. 微前端全应用分析
   - 生成一份所有子应用配置
   - 下载所有子应用代码到临时目录
   - 对子应用代码进行分析



### 扩展功能

1. 改为 monorepo 结构
2. 更多的功能
   - 变量命名检查
   - 依赖套娃检查
   - 代码安全扫描
   - 依赖关系图
   - ...
3. 支持更多的接入方式
   - webpack 插件
   - rollup 插件
   - ...
4. 平台化
   - 配置分析应用，配置插件等
   - 展示分析结果、做统计数据
5. 接入 AI
   - AI 生成插件（控制台命令行式）
   - AI 可视化（可视化生成插件、调试、发布等，涉及微调大模型）
   - AI 文档（投喂资料，微调大模型）