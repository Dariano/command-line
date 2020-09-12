'use strict';

require('dotenv').config({
    path: `${__dirname}/../.env`
})
const inquirer = require('inquirer')
const request = require('axios')
const colors = require('colors')
const k8s = require('@kubernetes/client-node');
const _ = require('lodash')
const Ora = require('ora');
const k8sService = require('./k8s-service')

inquirer.registerPrompt('checkbox-plus', require('inquirer-checkbox-plus-prompt'));
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

const notEmpty = (value) => {
    console.log(value)
    if (value.length > 0) return true

    return "Selecione ao menos um item!"
}

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

inquirer
    .prompt([{
            type: 'autocomplete',
            name: 'ambiente',
            message: 'Ambiente?',
            source: (answers, input) => {
                return Promise.resolve(kc.getContexts().filter(context => context.cluster.includes(input)).map(context => context.cluster))
            },
            validate: notEmpty
        },
        {
            type: 'autocomplete',
            name: 'namespace',
            message: 'Qual namespace?',
            source: (answers, input) => {
                return k8sService.listNameNamespaces(answers.ambiente, input)
            },
            validate: notEmpty
        },
        {
            type: 'confirm',
            name: 'all',
            message: 'Monitorar todos serviços?'
        },
        {
            type: 'checkbox-plus',
            name: 'services',
            highlight: false,
            searchable: true,
            message: 'Selecione o(s) serviço(s)?',
            source: (answers, input) => {
                return k8sService.listNameServices(answers.ambiente, answers.namespace, input)
            },
            validate: notEmpty,
            when: answers => !answers.all
        }
    ])
    .then(async (answers) => {
        kc.setCurrentContext(answers.ambiente);

        let services = await k8sService.listNameServices(answers.ambiente, answers.namespace)

        if(!answers.all)
            services = services.filter(service =>  answers.services.some(serviceName => service.name == serviceName))

        const spinner = new Ora('Analisando serviço(s) ...').start()

        services = services.map(service => {
            return {
                name: service.name,
                port: service.port,
                spinner: spinner
            }
        })

        return setInterval(async () => {
            if (services.length == 0) {
                process.exit(0)
            }

            services = await k8sService.monitoreServices(answers.ambiente, answers.namespace, services)
        }, 1000 * 3);
    });