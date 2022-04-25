const fs = require('fs');
const util = require('util');
const exists = util.promisify(fs.exists);
const cmd = require('node-cmd');
const _yaml = require('js-yaml');
const log = require('./utils/colorLog.js');
const path = require('path');

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

// TODO: 强耦合，后期考虑抽离
const deployerMap = [
  'git',
  'tencent cloudbase',
  'aliyun server',
  'aliyun oss'
];

/*
0. 校验vine.deployer.yml是否合法，如合法则解析
1. 判断是否有dist
2. 在dist中初始化git工作区（如果已有.git则忽略）
3. 将内容强推到分支上去
*/
function publish() {
  getYaml('./vine.deployer.yml')
  .then(res => {
    if (!deployerMap.includes(res.type)) {
      log.error(`Deployer type invalid, please check your config.`);
      process.exit(1);
    }
    if (res.type === 'git' && !(res.repo && res.branch && res.auth)) {
      log.error('You should configure deployer settings in vine.deployer.yml first, see this example:');
      console.log(
        `        type: git
        repo: <your git repo url>
        branch: main
        extend_dir: [extend directory]
      `)
      process.exit(1);
    }
    // TODO: 接入其他部署器时使用策略模式优化
    return res;
  })
  .catch(err => {
    log.error('Oops, something wrong in deployer.');
    log.error(err);
    log.error(`Vine.js can't find 'vine.deployer.yml', please check your config.`);
    process.exit(1);
  })
  .then(res => {
    return Promise.all([exists(path.resolve( '../dist')), res]);
  })
  .then(res => {
    console.log(res);
    // if 'dist' don't exist
    if (!res[0]) {
      log.error(`cannot find path 'dist', did you forget to build this project?`);
      log.error(`try run command 'vine build' first.`);
      process.exit(1);
    }
    return Promise.all([exists(path.resolve('../dist', '.git')), res[1]]);
  })
  .catch(err => {
    log.error('Oops, something wrong in deployer.');
    log.error(err);
    log.error(`Vine.js can't find 'vine.deployer.yml', please check your config.`);
    process.exit(1);
  })
}

publish();

module.exports = publish;