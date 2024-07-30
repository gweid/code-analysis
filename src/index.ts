import dayjs from 'dayjs';
import CodeAnalysis from './analysis';
import { REPORTTITLE, TIMEFORMAT } from './constant';

import { IAnalysisOptions } from './analysis.type';

const codeAnalysis = (config: IAnalysisOptions) => new Promise((resolve, reject) => {
  try {
    // 新建分析实例
    const coderTask = new CodeAnalysis(config);

    // 执行代码分析
    coderTask.analysis();

    const { reportTitle = REPORTTITLE } = config;

    const report = {
      title: reportTitle, // 分析报告标题
      analysisTime: dayjs(Date.now()).format(TIMEFORMAT), // 分析时间
      scoreMap: coderTask.scoreMap, // 评分及建议数据
      analysisMap: coderTask.analysisMap, // 分析数据
    };

    resolve({ report });
  } catch (error) {
    reject(error);
  }
});

export default codeAnalysis;
