#!/usr/bin/env node

const program = require('commander');
const packageData = require("./package.json");
const inquirer = require("inquirer");
const download = require("download-git-repo");
const ora = require("ora");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const { execSync } = require('child_process');
const { hasCnpm, hasYarn } = require("./utils/judgeEnv.js");
const templates = {
    'vue-multi-h5': {
        url: "http://gitlab.oeeee.cn/dingchhao/vue-h5-template.git",
        downloadUrl: "http://gitlab.oeeee.cn:dingchhao/vue-h5-template#master",
        description: "vue-h5 多项目文件模板"
    }
}
const PM_CONFIG = {
    npm: {
        install: ['install', '--loglevel', 'error'],
        remove: ['uninstall', '--loglevel', 'error'],
    },
    yarn: {
        install: [],
        remove: ['remove'],
    },
};
PM_CONFIG.cnpm = PM_CONFIG.npm;
let bin;
if (hasCnpm()) {
    bin = 'cnpm'
} else if (hasYarn()) {
    bin = 'yarn'
} else {
    bin = "npm"
}
program
    .version(packageData.version)
    .option("-i,--init", "初始化项目")
    .option("-V,--version", "查看版本号信息")
    .option("-l,--list", "查看当前可用模板");
program.parse(process.argv);
if (program.args.length < 1){
    return program.help()
}
if (program.opts() && program.opts().init) {
    let options = [
        {
            type: "input",
            name: "projectName",
            message: "请输入项目名称",
            validate: function (val) {
                if (val) return true;
                return false;
            }
        },
        {
            type: "input",
            name: "description",
            message: "请输入项目简介",
        },
        {
            type: "input",
            name: "author",
            message: "请输入作者名称",
        },
        {
            type: "list",
            name: "template",
            message: "选择其中一个作为项目模版",
            choices: [],
        },
    ]
    options.forEach((item) => {
        if (item.name === "template") {
            item.choices = Object.keys(templates)
        }
    })
    // 初始化项目
    inquirer
        .prompt(options)
        .then(res => {
            let { template } = res;
            let url = templates[template].downloadUrl;
            initTemplate(res, url);
        })
}
if (program.opts() && program.opts().list) {
    for (let key in templates) {
        console.log(chalk.cyanBright(`${key}:${templates[key].description}`));
    }
}

async function initTemplate(content, url) {
    console.log(
        chalk.bold.cyan(`项目正在生成`)
    );
    const { projectName = "" } = content;

    try {
        await checkName(projectName);
        await downloadTemplate(url, projectName);
        await rewritePackJson(content);
        console.log(chalk.green("模板下载完成"));
        await cdPath(projectName);
        console.log(chalk.green("自动安装依赖中..."))
        await install()
        console.log();
        console.log(chalk.green(`$ cd ${projectName}`));
        console.log(chalk.green('运行操作请阅读readme.md文件'));
        console.log();
    } catch (error) {
        console.log(chalk.red(error));
    }
}
//检查当前目录是否存在相同名称文件夹
function checkName(name) {
    return new Promise((resolve, reject) => {
        fs.readdir(process.cwd(), (err, data) => {
            if (err) {
                return reject(err)
            }
            if (data.includes(name)) {
                return reject(new Error(`${name}已存在`))
            }
            resolve()
        })
    })
}
function downloadTemplate(url, name) {
    const spinner = ora("模板下载中......").start();
    return new Promise((resolve, reject) => {
        download(url, path.resolve(process.cwd(), name), { clone: true }, function (err) {
            if (err) {
                spinner.fail();
                return reject(err);
            }
            spinner.succeed();
            resolve();
        })
    })
}
function rewritePackJson(content) {
    const { projectName = "", description = "", author = "" } = content;
    return new Promise((resolve, reject) => {
        fs.readFile(path.resolve(process.cwd(), projectName, "package.json"), "utf-8", (err, data) => {
            if (err) {
                return reject(err)
            }
            let packageContent = JSON.parse(data);
            packageContent.name = projectName;
            packageContent.author = author;
            packageContent.description = description;
            fs.writeFile(
                path.resolve(process.cwd(), projectName, "package.json"),
                JSON.stringify(packageContent, null, 2),
                "utf8",
                (err, data) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                }
            );
        })
    })
}
function runCommand(command, args = []) {
    const _commands = [bin, ...PM_CONFIG[bin][command], ...args];
    execSync(_commands.join(' '), { stdio: [0, 1, 2] });
}

function install() {
    try {
        runCommand('install', ['--offline']);
    } catch (e) {
        runCommand('install');
    }
}
function cdPath(projectName) {
    const aimPath = path.join(process.cwd(), projectName);
    console.log(aimPath)
    process.chdir(aimPath);
}