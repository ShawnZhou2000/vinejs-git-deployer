const fs = require('fs');
const util = require('util');
const exists = util.promisify(fs.exists);
const _cmd = require('node-cmd');
const cmd = util.promisify(_cmd.run);
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

let ymlConfig = {};
const commonPath = '../dist';

/*
0. 校验vine.deployer.yml是否合法，如合法则解析
1. 判断是否有dist
2. 在dist中初始化git工作区（如果已有.git则忽略）
3. 将内容强推到分支上去
*/
function publish() {
  getYaml('./vine.deployer.yml')
  .then(res => {
    if (res.type !== 'git') {
      log.error(`Deployer type invalid, please check your config.`);
      process.exit(1);
    }
    if (!(res.repo && res.branch && res.auth.user_name && res.auth.user_email)) {
      log.error('You should configure deployer settings in vine.deployer.yml first, see this example:');
      console.log(
        `        type: git
        repo: <your git repo url>
        branch: main
        auth:
          user_name: <your git user name>
          user_email: <your git user email></your>
        extend_dir: [extend directory]
      `)
      process.exit(1);
    }
    ymlConfig = res;
    return res;
  })
  .catch(err => {
    log.error('Oops, something wrong in deployer.');
    log.error(err);
    log.error(`Vine.js can't find 'vine.deployer.yml', please check your config.`);
    process.exit(1);
  })
  .then(res => {
    return exists(path.resolve( commonPath));
  })
  .then(res => {
    // if 'dist' don't exist
    if (!res) {
      log.error(`cannot find path 'dist', did you forget to build this project?`);
      log.error(`try run command 'vine build' first.`);
      process.exit(1);
    }
    return exists(path.resolve(commonPath, '.git'));
  })
  .catch(err => {
    log.error('Oops, something wrong in deployer.');
    log.error(err);
    log.error(`Vine.js can't find 'vine.deployer.yml', please check your config.`);
    process.exit(1);
  })
  .then(res => {
    // if '.git' already exist
    log.info('Setting up Git deployment...');
    if (res) {
      fs.rmdirSync(path.resolve(commonPath, '.git'));
      log.info('Rebuild .git directory...');
    }
    return cmd('git init');
  })
  .then(() => {
    return cmd(`git config user.name ${ymlConfig.auth.user_name}`);
  })
  .then(() => {
    return cmd(`git config user.email ${ymlConfig.auth.user_email}`);
  })
  .then(() => {
    return cmd(`git add .`);
  })
  .then(() => {
    // TODO: 后面加上更新时间
    return cmd(`git commit -m 'site updated'`);
  })
  .then(() => {
    return cmd(`git push -u ${ymlConfig.repo} HEAD:${ymlConfig.branch} --force`);
  })
  .then(res => {
    console.log(res);
  })
  .catch(err => {
    console.log(err);
    log.error('Oops, something wrong in deployer.');
    // log.error(`Vine.js can't find 'vine.deployer.yml', please check your config.`);
    process.exit(1);
  })
}

publish();

module.exports = publish;