"use strict";var fs=require("fs"),util=require("util"),exists=util.promisify(fs.exists),_cmd=require("node-cmd"),_yaml=require("js-yaml"),log=require("./utils/colorLog.js"),path=require("path"),dayjs=require("dayjs"),ymlConfig={},commonPath="dist",cmd=function(e){return new Promise(function(t,r){_cmd.run("cd ".concat(commonPath," && ").concat(e),function(e,n,o){e?r(o):t(n)})})},getYaml=function(t){return new Promise(function(e,n){var o={};try{o=_yaml.load(fs.readFileSync(t,"utf-8"))}catch(e){n(e)}finally{e(o)}})},clearDir=function n(o){var t;fs.readdirSync(o).forEach(function(e){t="".concat(o,"/").concat(e),fs.statSync(t).isDirectory()?n(t):fs.unlinkSync(t)}),fs.rmdirSync(o)};function publish(){getYaml("./vine.deployer.yml").then(function(e){return"git"!==e.type&&(log.error("Deployer type invalid, please check your config."),process.exit(1)),e.repo&&e.branch&&e.auth.user_name&&e.auth.user_email||(log.error("You should configure deployer settings in vine.deployer.yml first, see this example:"),console.log("        type: git\n        repo: <your git repo url>\n        branch: main\n        auth:\n          user_name: <your git user name>\n          user_email: <your git user email></your>\n        extend_dir: [extend directory]\n      "),process.exit(1)),ymlConfig=e}).catch(function(e){log.error("Oops, something wrong in deployer."),log.error(e),log.error("vine.deployer.yml not found in deployer path, please check your config."),process.exit(1)}).then(function(){return exists(path.resolve(commonPath))}).then(function(e){return e||(log.error("cannot find path 'dist', did you forget to build this project?"),log.error("try run command 'vine build' first."),process.exit(1)),exists(path.resolve(commonPath,".git"))}).then(function(e){return log.info("Setting up Git deployment..."),e&&(log.info("Rebuilding .git directory..."),clearDir(path.resolve(commonPath,".git"))),cmd("git init")}).then(function(e){return log.info(e),cmd("git config user.name ".concat(ymlConfig.auth.user_name))}).then(function(){return cmd("git config user.email ".concat(ymlConfig.auth.user_email))}).then(function(){return cmd("git add -A")}).then(function(){return cmd('git commit -m "update at '.concat(dayjs().format("YYYY-MM-DD HH:mm:ss"),'"'))}).then(function(){return cmd("git push -u ".concat(ymlConfig.repo," HEAD:").concat(ymlConfig.branch," --force"))}).then(function(e){log.info(e),log.info("dist published successfully.")}).catch(function(e){console.log(e),log.error("Oops, something wrong in deployer."),process.exit(1)})}module.exports=publish;
