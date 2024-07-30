import { CodeAnalysisInstance } from 'src/analysis';

export type DefaultScorePluginReturn = {
  score: number;
  message: string[];
} | null;

export type DefaultScorePlugin = (analysisContext: CodeAnalysisInstance) => DefaultScorePluginReturn;
