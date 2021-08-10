const path = require('path')
const fs = require('fs-extra')
const inquirer = require("inquirer");
const Generator = require('./Generator')
module.exports = async function (name, options) {
    const cwd = process.cwd();
    const targetAir = path.join(cwd, name)
    if (fs.existsSync(targetAir)) {
        if (options.force) {
            await fs.remove(targetAir)
        } else {
            // 询问用户是否确定要覆盖
            let { action } = await inquirer.prompt([
                {
                    name: 'action',
                    type: 'list',
                    message: '文件夹已存在，是否覆盖',
                    choices: [
                        {
                            name: '是',
                            value: 'overwrite'
                        }, {
                            name: '否',
                            value: false
                        }
                    ]
                }
            ])
            if (!action) {
                return;
            } else if (action === 'overwrite') {
                // 移除已存在的目录
                console.log(`\r\nRemoving...`)
                await fs.remove(targetAir)
            }
        }
    }
    const generator = new Generator(name, targetAir);

    // 开始创建项目
    generator.create()
}