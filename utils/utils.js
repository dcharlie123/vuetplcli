//检查当前目录是否存在相同名称文件夹
const path = require('path')
const fs = require('fs-extra')
function isExtra(name) {
    return new Promise((resolve, reject) => {
        const cwd = process.cwd();
        const targetAir = path.join(cwd, name)
        if (fs.existsSync(targetAir)) {
            resolve(targetAir);
        } else {
            reject();
        }
    }).catch((err => { console.log(err) }))
}
module.exports = {
    isExtra
}