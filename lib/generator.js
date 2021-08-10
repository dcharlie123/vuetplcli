const chalk = require("chalk");
const templatelist = require("../utils/templates.js");
const ora = require("ora");
const path = require('path')
const inquirer = require("inquirer");
const download = require("download-git-repo");
const fs = require("fs");
const { execSync } = require('child_process');
const { hasCnpm, hasYarn } = require("../utils/judgeEnv.js");
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
function cdPath(name) {
    const aimPath = path.join(process.cwd(), name);
    console.log(aimPath)
    process.chdir(aimPath);
}

class Generator {
    constructor(name, targetDir) {
        // 目录名称
        this.name = name;
        // 创建位置
        this.targetDir = targetDir;
    }
    async getRepo() {
        // 用户选择自己新下载的模板名称
        const { repo } = await inquirer.prompt({
            type: "list",
            name: "repo",
            message: "选择其中一个作为项目模版",
            choices: Object.keys(templatelist)
        })

        return repo;
    }
    async getInfo() {
        const info = await inquirer.prompt([
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
        ])
        return info;
    }
    async download(repo) {
        let url = templatelist[repo].downloadUrl;
        await this.downloadTemplate(url);
    }
    downloadTemplate(url) {
        const spinner = ora("模板下载......").start();
        return new Promise((resolve, reject) => {
            download(url, path.resolve(process.cwd(), this.targetDir), { clone: true }, function (err) {
                if (err) {
                    spinner.fail();
                    return reject(err);
                }
                spinner.succeed();
                resolve();
            })
        })
    }
    rewritePackJson(content) {
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
    async create() {

        const repo = await this.getRepo();
        const info = await this.getInfo();
        await this.download(repo);
        await this.rewritePackJson({ ...info, projectName: this.name });
        console.log(chalk.green("模板下载完成"));
        await cdPath(this.name);
        console.log(chalk.green("自动安装依赖中..."))
        await install();
        console.log();
        console.log(chalk.green(`$ cd ${projectName}`));
        console.log(chalk.green('运行操作请阅读readme.md文件'));
        console.log();
    }
}
module.exports = Generator;