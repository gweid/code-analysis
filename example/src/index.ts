import utilsFunc from './utils';
import * as utilsTool from './utils';
import { getFullName } from './utils';
import { testFunc as getTest } from './utils';
import { toolFunc } from './tools';

const fullName = getFullName('li', 'xiaolong');
const testTxt = getTest();
const utilsTxt = utilsFunc();
const testTxt1 = utilsTool.testFunc();
const toolFuncTxt = toolFunc();

console.log(fullName);
console.log(testTxt);
console.log(testTxt1);
console.log(utilsTxt);
console.log(toolFuncTxt);

const fullFunc = () => {
  const toolFunc = () => 'fullFunc --> toolFunc';

  return toolFunc();
};

console.log(fullFunc());
