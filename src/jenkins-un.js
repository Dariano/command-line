'use strict';
require('dotenv').config({
    path: `${__dirname}/../.env`
})
const inquirer = require('inquirer')
const jenkinsFactory = require('./jenkins-factory')
const notification = require('./notification')
const chalkPipe = require('chalk-pipe')
const colors = require('colors');
const _ = require('lodash')
const ora = require('ora');
const { sendMessage } = require('./slack')
const k8sService = require('./k8s-service')

inquirer.registerPrompt('checkbox-plus', require('inquirer-checkbox-plus-prompt'));
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
inquirer.registerPrompt('chalk-pipe', require('inquirer-chalk-pipe'));

const notEmpty = (value) => {
    if (value) return true

    return "Não pode ser vazio!"
}

inquirer
    .prompt([{
            type: 'autocomplete',
            name: 'projeto',
            highlight: false,
            searchable: true,
            message: 'Selecione o(s) projeto(s)?',
            source: jenkinsFactory.search,
            validate: notEmpty,
            filter: value => _.replace(value, new RegExp(" ", "g"), '/'),
        },
        {
            type: 'confirm',
            name: 'version',
            message: 'Escolher versão?'
        },
        {
            type: 'autocomplete',
            name: 'appVersion',
            message: 'App Version?',
            source: jenkinsFactory.getAppVersion,
            when: (answers) => answers.version,
            validate: notEmpty
        },
        {
            type: 'confirm',
            name: 'monitorar',
            message: 'Monitorar serviço?'
        }
    ])
    .then(async (answers) => {
        return build(answers.projeto, answers.appVersion)
    });

const build = async (projeto, appVersion) => {
        await jenkinsFactory.build(projeto, appVersion)
        const job = await jenkinsFactory.getJob(projeto)

        const spinner = ora().start()
        spinner.text = `Aguarde, ${projeto}`

        const intervalBuild = setInterval(async () => {
            const build = await jenkinsFactory.statusBuild(projeto, job.nextBuildNumber)

            if (build && build.building == false) {
                await dispararMensagem(build, spinner)
                clearInterval(intervalBuild)
                const namespace = _.lowerCase(projeto.split('/')[1])
                const service = _.lowerCase(projeto.split('/')[2])
                const ambiente = _.lowerCase(projeto.split('/')[3])

                if(!['tst', 'hlg', 'prd'].some(a => a == ambiente)) {
                    process.exit(0)
                }

                let services = [{
                    name: service,
                    spinner: ora( `Iniciado monitoramento, ${namespace} - ${service} - ${ambiente}`).start()
                }]

                return setInterval(async () => {
                    services = await k8sService.monitoreServices(ambiente, namespace, services)

                    if(services.length == 0) {
                        process.exit(0)
                    }
                }, 1000 * 3)
            }
        }, 1000 * 5)

    return intervalBuild
}

const dispararMensagem = async (build, spinner) => {
    const result = build.result == 'SUCCESS'
    result ? spinner.succeed('Build finalizado.') : spinner.fail('Build finalizado.')
    await notification.send(build.result, build.url)
}