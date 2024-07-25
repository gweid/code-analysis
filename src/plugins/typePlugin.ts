import { ICheckFunOpt } from './types/common.type';

const typePlugin = () => {
  const mapName = 'typeMap';

  /**
   * 主要用来判定引入的是否属于 ts 声明类型
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
  const isTypeCheck = ({
    context,
    tsCompiler,
    node,
    depth,
    apiName,
    matchImportItem,
    filePath,
    projectName,
    httpRepo,
    line,
  }: ICheckFunOpt) => {
    if (node.parent && tsCompiler.isTypeReferenceNode(node.parent)) {
      if (!context[mapName][apiName]) {
        context[mapName][apiName] = {};
        context[mapName][apiName].callNum = 1;
        context[mapName][apiName].callOrigin = matchImportItem.origin;
        context[mapName][apiName].callFiles = {};
        context[mapName][apiName].callFiles[filePath] = {};
        context[mapName][apiName].callFiles[filePath].projectName = projectName;
        context[mapName][apiName].callFiles[filePath].httpRepo = httpRepo;
        context[mapName][apiName].callFiles[filePath].lines = [];
        context[mapName][apiName].callFiles[filePath].lines.push(line);
      } else {
        context[mapName][apiName].callNum++;
        if (!Object.keys(context[mapName][apiName].callFiles).includes(filePath)) {
          context[mapName][apiName].callFiles[filePath] = {};
          context[mapName][apiName].callFiles[filePath].projectName = projectName;
          context[mapName][apiName].callFiles[filePath].httpRepo = httpRepo;
          context[mapName][apiName].callFiles[filePath].lines = [];
          context[mapName][apiName].callFiles[filePath].lines.push(line);
        } else {
          context[mapName][apiName].callFiles[filePath].lines.push(line);
        }
      }
    }
  };

  return {
    mapName,
    checkFun: isTypeCheck,
    afterHook: null,
  };
};

export default typePlugin;
