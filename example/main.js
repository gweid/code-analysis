const CodeAnalysisMoudle = require('../dist/index.cjs').default;
const codeanalysisConfig = require('./codeanalysis.config');

const codeAnalysis = new CodeAnalysisMoudle(codeanalysisConfig);

codeAnalysis.analysis();
