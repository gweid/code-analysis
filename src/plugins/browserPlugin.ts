import { CodeAnalysisInstance } from 'src/analysis';
import { ICheckFunBroswerOpt } from './types/common.type';

const browserPlugin = (analysisContext: CodeAnalysisInstance) => {
  const mapName = 'browserMap';
  const analysisMap = analysisContext.analysisMap;
  analysisMap[mapName] = {};

  /**
   * 统计以全局变量形式在代码中直接调用的 API，比如依托于浏览器环境或者直接挂载到 window 上的 API
   * @param context codeAnalysis分析实例上下文
   * @param tsCompiler typescript编译器
   * @param node 基准分析节点baseNode
   * @param depth 链式调用深度
   * @param apiName api完整调用名（含链式调用）
   * @param matchImportItem API调用在import节点中的声明信息
   * @param filePath 代码文件路径
   * @param projectName 待分析代码文件所在的项目名称
   * @param httpRepo 用于在代码分析报告展示在线浏览代码文件的http链接前缀
   * @param line  API调用所在代码文件中的行信息
   */
  const checkFun = ({
    context,
    tsCompiler,
    node,
    depth,
    apiName,
    filePath,
    projectName,
    httpRepo,
    line,
  }: ICheckFunBroswerOpt) => {
    if (!analysisMap[mapName][apiName]) {
      analysisMap[mapName][apiName] = {};
      analysisMap[mapName][apiName].callNum = 1;
      analysisMap[mapName][apiName].callFiles = {};
      analysisMap[mapName][apiName].callFiles[filePath] = {};
      analysisMap[mapName][apiName].callFiles[filePath].projectName = projectName;
      analysisMap[mapName][apiName].callFiles[filePath].httpRepo = httpRepo;
      analysisMap[mapName][apiName].callFiles[filePath].lines = [];
      analysisMap[mapName][apiName].callFiles[filePath].lines.push(line);
    } else {
      analysisMap[mapName][apiName].callNum++;
      if (!Object.keys(analysisMap[mapName][apiName].callFiles).includes(filePath)) {
        analysisMap[mapName][apiName].callFiles[filePath] = {};
        analysisMap[mapName][apiName].callFiles[filePath].projectName = projectName;
        analysisMap[mapName][apiName].callFiles[filePath].httpRepo = httpRepo;
        analysisMap[mapName][apiName].callFiles[filePath].lines = [];
        analysisMap[mapName][apiName].callFiles[filePath].lines.push(line);
      } else {
        analysisMap[mapName][apiName].callFiles[filePath].lines.push(line);
      }

      return true; // true: 命中规则, 终止执行后序插件
    }

    return false; // false: 未命中检测逻辑, 继续执行后序插件
  };

  return {
    mapName,
    checkFun,
    afterHook: null,
  };
};

export default browserPlugin;
