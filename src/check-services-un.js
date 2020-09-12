'use strict';

require('dotenv').config({
    path: `${__dirname}/../.env`
})
const inquirer = require('inquirer')
const request = require('axios')
const colors = require('colors')
const k8s = require('@kubernetes/client-node');

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
                kc.setCurrentContext(answers.ambiente);

                const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
                return k8sApi.listNamespace()
                    .then(res => {
                        const items = res.body['items']
                        const projetosFiltrado = items.filter(service => service.metadata.name.includes(input))
                        return projetosFiltrado.map(service => service.metadata.name)
                    })
            },
            validate: notEmpty
        },
        {
            type: 'confirm',
            name: 'showBD',
            message: 'Não Mostrar config BD?'
        }
    ])
    .then(async (answers) => {
        const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
        const nodeFirt = await k8sApi.listNode().then(res => res.body['items'][0].metadata.name);
        k8sApi.listNamespacedService(answers.namespace)
            .then((res) => {
                const items = res.body['items']
                items.forEach(async (service) => {
                    try {
                        const url = `http://${nodeFirt}:${service.spec.ports[0].nodePort}/management/health`
                        await checkService(url, answers, service)
                    } catch (error) {
                        const url = `https://servicos-${answers.ambiente}.e-unicred.com.br/${service.metadata.name}/management/health`
                        await checkService(url, answers, service)
                    }
                })
            });
    });

const checkService = (url, answers, service) => {
    return request.get(url)
        .then(res => {
            showMessage(url, answers, service, res)
        })
        .catch(error => {
            if (error.response.status == 404) {
                console.log(`${url} - ${service.metadata.name}: ` + 'UP'.green)
            } else {
                console.log(`${url} - ${service.metadata.name}: ` + 'DOWN'.red)
            }
        })
}

const showMessage = (url, answers, service, res) => {
    if (!answers.showBD && res.data) {
        console.log(`${url} - ${service.metadata.name}: ${res.data.status.green} -> DB ${colors.yellow(JSON.stringify(res.data['db']))}`)
    } else if(res.data) {
        console.log(`${url} - ${service.metadata.name}: ${colors.green(res.data.status)} - ${res.status}`)
    }
    else {
        console.log(`${url} - ${service.metadata.name}: ` + 'DOWN'.red)
    }
}