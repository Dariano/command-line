'use strict';

require('dotenv').config({
    path: `${__dirname}/../.env`
})
const inquirer = require('inquirer')
const colors = require('colors')
const k8s = require('@kubernetes/client-node');
const k8sService = require('./k8s-service')
const Ora = require('ora');
const _ = require('lodash')

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
            type: 'checkbox-plus',
            name: 'pods',
            highlight: false,
            searchable: true,
            message: 'Selecione o(s) pod(s)?',
            source: (answers, input) => {
                const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

                return k8sApi.listNamespacedPod(answers.namespace)
                    .then(res => {
                        const items = res.body['items']
                        return items.filter(service => service.metadata.name.includes(input))
                            .map(service => service.metadata.name)
                    })
                    .catch(e => console.log(e.response))
            },
            validate: notEmpty,
        }
    ])
    .then(async (answers) => {
        const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

        const spinner = new Ora('Analisando serviço(s) ...').start()

        answers.pods.forEach(async (pod) => {
            await k8sApi.deleteNamespacedPod(pod, answers.namespace)
                .then(() => {
                    spinner.succeed(`Pod ${pod} reniciado.`)
                    spinner.start()
                })
                .catch(() => {
                    spinner.fail(`Pod ${pod} não pode reniciar.`)
                    spinner.start()
                })
        });

        let services = await k8sService.listNameServices(answers.ambiente, answers.namespace)
        services = services.filter(service => answers.pods.some(pod => _.startsWith(pod, service.name)))

        services = services.map(service => {
            return {
                name: service.name,
                port: service.port,
                spinner: spinner
            }
        })

        return setInterval(async () => {
            services = await k8sService.monitoreServices(answers.ambiente, answers.namespace, services)
            
            if (services.length == 0) {
                process.exit(0)
            }
        }, 1000 * 3)
    });