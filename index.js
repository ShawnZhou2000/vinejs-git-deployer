const fs = require('fs');
const util = require('util');
const exists = util.promisify(fs.exists);
const _cmd = require('node-cmd');
const _yaml = require('js-yaml');
const log = require('./utils/colorLog.js');
const path = require('path');
const dayjs = require('dayjs');
let ymlConfig = {};
const commonPath = 'dist';

const cmd = (commandStr) => {
  return new Promise((resolve, reject) => {
    _cmd.run(`cd ${commonPath} && ${commandStr}`, (err, data, stderr) => {
      if (err) {
        reject(stderr);
      } else {
        resolve(data);
      }
    })
  });
}

const getYaml = (dir) => {
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

const clearDir = (path) => {
  let fileURL = null;
  fs.readdirSync(path).forEach(data => {
    fileURL = `${path}/${data}`;
    if (fs.statSync(fileURL).isDirectory()) {
      clearDir(fileURL);
    } else {
      fs.unlinkSync(fileURL);
    }
  });
  fs.rmdirSync(path);
}

/*
0. 校验vine.deployer.yml是否合法，如合法则解析
1. 判断是否有dist
2. 在dist中初始化git工作区（如果已有.git则忽略）
3. 将内容强推到分支上去
*/
function publish() {
  return getYaml('./vine.deployer.yml')
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
    // yaml file error
    log.error('Oops, something wrong in deployer.');
    log.error(err);
    log.error(`vine.deployer.yml not found in deployer path, please check your config.`);
    process.exit(1);
  })
  .then(() => {
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
  .then(res => {
    log.info('Setting up Git deployment...');
    // if '.git' already exist
    if (res) {
      log.info('Rebuilding .git directory...');
      clearDir(path.resolve(commonPath, '.git'));
    }
    return cmd('git init');
  })
  .then((res) => {
    log.info(res);
    return cmd(`git config user.name ${ymlConfig.auth.user_name}`);
  })
  .then(() => {
    return cmd(`git config user.email ${ymlConfig.auth.user_email}`);
  })
  .then(() => {
    return cmd(`git add -A`);
  })
  .then(() => {
    return cmd(`git commit -m "update at ${dayjs().format('YYYY-MM-DD HH:mm:ss')}"`);
  })
  .then(() => {
    return cmd(`git push -u ${ymlConfig.repo} HEAD:${ymlConfig.branch} --force`);
  })
  .then(res => {
    log.info(res);
    log.info(`dist published successfully.`);
    return res;
  })
  .catch(err => {
    console.log(err);
    log.error('Oops, something wrong in deployer.');
    process.exit(1);
  })
}

// publish();

module.exports = publish;