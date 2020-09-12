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
const {
    sendMessage
} = require('./slack')
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
            type: 'checkbox-plus',
            name: 'ambientes',
            message: 'Ambientes?',
            source: (answers, input) => {
                return Promise.resolve(['build', 'tst', 'hlg', 'prd'])
            },
            validate: notEmpty
        },
        {
            type: 'autocomplete',
            name: 'namespace',
            message: 'Qual namespace?',
            source: (answers, input) => {
                const ambiente = 'tst'
                return k8sService.listNameNamespaces(ambiente, input)
            },
            validate: notEmpty
        },
        {
            type: 'autocomplete',
            name: 'service',
            message: 'Qual serviço?',
            source: (answers, input) => {
                const ambiente = 'tst'
                return k8sService.listNameServices(ambiente, answers.namespace, input)
            },
            validate: notEmpty
        },
        {
            type: 'autocomplete',
            name: 'appVersion',
            message: 'App Version?',
            source: async (answers, input) => {
                if (!input || input.length < 3) return Promise.resolve([])

                let projeto = `servicos ${answers.namespace} ${answers.service} tst`
                const [search] = await jenkinsFactory.search(null, projeto)
                const obj = {
                    projeto: _.replace(search.name, new RegExp(" ", "g"), '/')
                }

                return await jenkinsFactory.getAppVersion(obj, input)
            },
            validate: notEmpty
        }
    ])
    .then(async (answers) => {

        const spinner = ora().start()
        spinner.text = `Aguarde, ${projeto}`

        let flow = answers.ambientes.map(async (ambiante) => {
            const input = `servicos ${answers.namespace} ${answers.service} ${ambiante}`
            const [search] = await jenkinsFactory.search(null, input)
            const project = _.replace(search.name, new RegExp(" ", "g"), '/')
            return {
                ambiante,
                project,
                spinner,
                service: answers.service,
                namespace: answers.namespace,
                build: build,
                appVersion: answers.appVersion,
                status: status.IN_QUEUE,
                job: {}
            }
        })

        const flowInProgress = _.head(flow)

        setInterval(async () => {
            flow = await flow.map(execute)

        }, 1000 * 3)

    });

const status = {
    IN_QUEUE: 'IN_QUEUE',
    BUILD: 'BUILD',
    MONITORE: 'MONITORE',
    DONE: 'DONE'
}

const execute = async (flow) => {
    if(flow.status == status.DONE) {
        return flow
    }

    if(flow.status == status.IN_QUEUE) {
        flow.status = status.BUILD
        flow.job = build(flow.project, flow.appVersion)
    }

    if(flow.status == status.BUILD) {
        if(finishBuildJenkins(flow.project, flow.job)) {
            flow.status = status.MONITORE
            monitoreService(flow.ambiante, flow.service)
        }
    }

    if(flow.status == status.MONITORE) {
        if(monitoreService(flow.ambiante, flow.service)) {
            flow.status = status.DONE
        }
    }

    return flow
}

const build = async (projeto, appVersion) => {
    await jenkinsFactory.build(projeto, appVersion)
    const job = await jenkinsFactory.getJob(projeto)

    return job
}

const finishBuildJenkins = async (projeto, job) => {
    const build = await jenkinsFactory.statusBuild(projeto, job.nextBuildNumber)

    return build && build.building == false
}

const monitoreService = async (ambiente, service) => {
    if (!['tst', 'hlg', 'prd'].some(a => a == ambiente)) {
        process.exit(0)
    }

    let services = [{
        name: service,
        spinner: ora(`Iniciado monitoramento`).start()
    }]

    services = await k8sService.monitoreServices(ambiente, namespace, services)

    return services.length == 0
}

const dispararMensagem = async (build, spinner) => {
    const result = build.result == 'SUCCESS'
    result ? spinner.succeed('Build finalizado.') : spinner.fail('Build finalizado.')
    await notification.send(build.result, build.url)
}