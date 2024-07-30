import { CodeAnalysisInstance } from '../../analysis';

/**
 * 代码评分
 * @param analysisContext analysis 实例
 */
const defaultScorePlugin = (analysisContext: CodeAnalysisInstance) => analysisContext;

export default defaultScorePlugin;
