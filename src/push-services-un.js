'use strict';

require('dotenv').config({
    path: `${__dirname}/../.env`
})
const inquirer = require('inquirer')
const colors = require('colors')
const k8s = require('@kubernetes/client-node');
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
            type: 'checkbox-plus',
            name: 'ambiente',
            message: 'Ambiente?',
            source: (answers, input) => {
                return Promise.resolve(['tst', 'hlg', 'prd'].filter(p => p.includes(input)))
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
                             .map(service =>  service.metadata.name)
                    })
                    .catch(e => console.log(e.response))
            },
            validate: notEmpty,
        }
    ])
    .then(async (answers) => {
        const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

        // answers.pods.forEach(async (pod) => {
        //     await k8sApi.deleteNamespacedPod(pod, answers.namespace)
        //         .then(res => console.log(`\n Removido - ${pod} \n`.green))
        //         .catch(error => console.log('Error - '.red, error.status))
        // });

        const pods = await k8sApi.listNamespacedPod(answers.namespace)
                                .then(res => res.body['items'])

        return setInterval(async () => {
            answers.pods.forEach(aPod => {
                pods
                    .map(pod => pod.status)
                    .filter(status => _.startsWith(aPod, status.containerStatuses[0].name))
                    .forEach(status => {
                        console.log('>>>>>>>', status.phase)
                        console.log('>>>>>>>', status.containerStatuses)
                    })
            })
        }, 1000 * 5)
    });