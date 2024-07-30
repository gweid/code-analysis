const codeAnalysis = require('../dist/index.cjs').default;
const codeanalysisConfig = require('./codeanalysis.config');

codeAnalysis(codeanalysisConfig)
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  });
