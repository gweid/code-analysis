module.exports = {
  scanSource: ['example/src'],
  analysisTarget: './utils',
  browserApis: ['window', 'document', 'history'],
  isScanVue: true,
  blackList: ['getFullName'],
  scorePlugin: 'default',
};
