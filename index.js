#!/usr/bin/env node

const program = require('commander');
const packageData = require("./package.json");

program
    .command('create <app-name>')
    .description('create a new project')
    .option('-f, --force', 'overwrite target directory if it exist')
    .action((name, options) => {
        console.log('name', name, 'options', options);
        require("./lib/create.js")(name, options)
    })
program
    .version(packageData.version)
    .usage('<command> [options]')
program.parse(process.argv);
