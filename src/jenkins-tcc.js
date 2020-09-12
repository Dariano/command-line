'use strict';
require('dotenv').config({
    path: `${__dirname}/../.env`
})
const inquirer = require('inquirer')
const jenkinsFactory = require('./jenkins-factory')
const notification = require('./notification')
const chalkPipe = require('chalk-pipe')
const colors = require('colors');

inquirer.registerPrompt('checkbox-plus', require('inquirer-checkbox-plus-prompt'));
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
inquirer.registerPrompt('chalk-pipe', require('inquirer-chalk-pipe'));

const notEmpty = (value) => {
    if (value) return true

    return "Não pode ser vazio!"
}

inquirer
    .prompt([
        {
            type: 'input',
            name: 'projeto',
            highlight: false,
            message: 'Projeto?',
            default: 'events-portal-bff',
            validate: notEmpty
        },
        {
            type: 'input',
            name: 'branch',
            message: 'Branch?',
            default: 'dev',
            validate: notEmpty
        },
    ])
    .then(answers => {
        console.log('Aguardando finalizar build!!!')
        jenkinsFactory.build(answers.projeto, answers.branch)

        return setInterval(async () => {
            const build = await jenkinsFactory.statusBuild(answers.projeto, answers.branch)
            const buildFull = await jenkinsFactory.statusBuildFull(answers.projeto, answers.branch)
            console.log(build)

            // if (build.result) {
            //     notification.send(build.result, build.fullDisplayName, `${build.url}`)
            //     process.exit(0)
            // }

        }, 1000 * 5)
    });
