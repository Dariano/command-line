'use strict';
require('dotenv').config({
    path: `${__dirname}/../.env`
})
const inquirer = require('inquirer')
const gitlabFactory = require('./gitlab-factory')
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
            type: 'checkbox-plus',
            name: 'projetos',
            highlight: false,
            searchable: true,
            message: 'Selecione o(s) projeto(s)?',
            source: jenkinsFactory.search,
            validate: notEmpty
        },
        {
            type: 'autocomplete',
            name: 'branch',
            message: 'Branch?',
            source: gitlabFactory.branches,
            validate: notEmpty
        },
    ])
    .then(answers => {
        answers.projetos.forEach(projeto => {
            jenkinsFactory.build(projeto, answers.branch)
        });

        console.log('Aguardando finalizar build!!!')
        let removeProjects = []
        let statusProjectsJenkins = []

        return setInterval(async () => {
            answers.projetos.forEach(async (projeto) => {
                const build = await jenkinsFactory.statusBuild(projeto, answers.branch)
                const buildFull = await jenkinsFactory.statusBuildFull(projeto, answers.branch)

                if (build.result) {
                    notification.send(build.result, build.fullDisplayName, `${build.url}`)
                    removeProjects.push(projeto)
                }
            });

            removeProjects.forEach(projeto => {
                const index = answers.projetos.indexOf(projeto)
                if (index > -1) answers.projetos.splice(index)
            })

            if (!answers.projetos || answers.projetos.length == 0) process.exit(0)

        }, 1000 * 5)
    });
