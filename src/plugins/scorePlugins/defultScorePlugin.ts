import { DefaultScorePlugin } from './score.type';

/**
 * 代码评分
 * @param analysisContext analysis 实例
 */
const defaultScorePlugin: DefaultScorePlugin = (analysisContext) => {
  const { analysisMap } = analysisContext;

  let score = 100; // 初始分数
  const message: string[] = []; // 代码建议

  Object.keys(analysisMap).forEach((mapName) => {
    Object.keys(analysisMap[mapName]).forEach((apiName) => {
      // 如果使用了黑名单 API，那么扣 5 分
      if (analysisMap[mapName][apiName].isBlack) {
        score = score - 5;
        message.push(`${apiName} 属于黑名单 API，请勿使用；请改为使用 xxx`);
      }

      // 浏览器全局 API 扣分处理
      if (mapName === 'browserMap') {
        let keyName = '';
        if (apiName.split('.').length) {
          keyName = apiName.split('.')[0];
        } else {
          keyName = apiName;
        }

        switch (keyName) {
          case 'window':
            message.push(`${apiName} 属于全局类型 API，建议请评估影响慎重使用`);
            break;
          case 'document':
            message.push(`${apiName} 属于 Dom 类型操作 API，建议请评估影响慎重使用`);
            break;
          case 'history':
            score = score - 2;
            message.push(`${apiName} 属于路由类操作，请使用框架提供的 Router API 代替`);
            break;
          case 'location':
            message.push(`${apiName} 属于路由类操作，请使用框架提供的 Router API 代替`);
            break;
        }
      }
    });
  });

  // 最低为 0 分
  if (score < 0) score = 0;

  return {
    score,
    message,
  };
};

export default defaultScorePlugin;
