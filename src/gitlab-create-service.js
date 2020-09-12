'use strict';

require('dotenv').config({
    path: `${__dirname}/../.env`
})
const inquirer = require('inquirer')
const { sendMessage } = require('./slack')
const jenkinsFactory = require('./jenkins-factory')
const gitlabFactory = require('./gitlab-factory')
const notification = require('./notification')

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

const notEmpty = (value) => {
    if (value) return true

    return "Não pode ser vazio!"
}

inquirer
    .prompt([
        // {
        //     type: 'autocomplete',
        //     name: 'namespace',
        //     message: 'Qual o namespace?',
        //     pageSize: 10,
        //     source: gitlabFactory.namespaces,
        //     validate: notEmpty
        // },
        {
            type: 'input',
            name: 'name',
            message: 'Nome do NOVO projeto:',
            validate: notEmpty
        }
    ])
    .then(async answers => {
        try {
            // const [projeto] = await gitlabFactory.search(answers.name)
            // const namespaceId = answers.namespace.match(/\d+/g)[0];
            await gitlabFactory.create(answers.name, 324)
            console.log(`http://gitlab.agiplan.aws.local/agib@nk-usa/services/${answers.name}`)
        } catch (error) {
            console.error(error)
        }
    });
