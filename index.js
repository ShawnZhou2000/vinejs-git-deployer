const fs = require('fs');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const cmd = require('node-cmd');
const _yaml = require('js-yaml');

const getYaml = function(dir) {
  return new Promise((resolve, reject) => {
    let yamlData = {};
    try {
      yamlData = _yaml.load(fs.readFileSync(dir, 'utf-8'));
    } catch (e) {
      reject(e);
    } finally {
      resolve(yamlData);
    }
  });
}

/*
0. 校验vine.deployer.yml是否合法，如合法则解析
1. 判断是否有dist
2. 在dist中初始化git工作区（如果已有.git则忽略）
3. 将内容强推到分支上去
*/
module.exports = function() {
  getYaml('./vine.deployer.yml')
  .then(res => {
    console.log(res);
  })
  .catch(err => {
    console.log(err);
  })
}