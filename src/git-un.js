'use strict';
require('dotenv').config({
    path: `${__dirname}/../.env`
})
const inquirer = require('inquirer')
const colors = require('colors');
const _ = require('lodash')
const ora = require('ora');
const git = require('simple-git/promise')
const lineReader = require('line-reader');
const fs = require('fs')
const slack = require('./slack')
const notifier = require('node-notifier');

inquirer.registerPrompt('suggest', require('inquirer-prompt-suggest'));

const notEmpty = (value) => {
    if (value) return true

    return "Não pode ser vazio!"
}

inquirer
    .prompt([{
        type: 'list',
        name: 'tipoApp',
        message: 'Tipo de aplicação?',
        choices: ['JAVA', 'NODEJS'],
        validate: notEmpty
    }, {
        type: 'text',
        name: 'version',
        message: 'Qual a versão?',
        default: (answers) => {
            if (answers.tipoApp == 'JAVA') {
                const file = 'gradle.properties'
                if(fileValid(file)) {
                    return getVersionAppJava(file)
                }
            }

            if (answers.tipoApp == 'NODEJS'){
                const file = 'package.json'
                if(fileValid(file)) {
                    return getVersionAppNodejs(file)
                }
            }
            return '1.0.0-RELEASE'
        },
        validate: notEmpty
    }])
    .then(async (answers) => {
        await git().addTag(answers.version)
        await git().pushTags(`origin`)

        console.log(`Tag ${answers.version.yellow}.`.green)

        await slack.sendMessage(`:heavy_check_mark: Tag ${answers.version} criada com sucesso.`)
    });

const getVersionAppJava = (file) => {
    fileValid(file)

    const path = process.cwd()

    return new Promise((resolve) => {
        lineReader.eachLine(`${path}/${file}`, function (line) {
            if (_.startsWith(line, 'version=')) {
                resolve(line.split('=')[1])
            }
        });
    })
}

const getVersionAppNodejs = (file) => {
    fileValid(file)

    const path = process.cwd()

    return new Promise(resolve => {
        const packageNodejs = require(`${path}/${file}`)

        resolve(packageNodejs.version)
    })
}

const fileValid = (file) => {
    const pathBase = process.cwd()
    const existFile = fs.existsSync(`${pathBase}/${file}`)

    if (!existFile)
        console.log(`Arquivo ${file.red} não encontrado.`)

    return existFile
}