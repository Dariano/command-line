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
        {
            type: 'autocomplete',
            name: 'projeto',
            message: 'Qual projeto?',
            pageSize: 10,
            source: gitlabFactory.projetos,
            validate: notEmpty
        },
        {
            type: 'autocomplete',
            name: 'source_branch',
            message: 'Source branch:',
            pageSize: 10,
            source: gitlabFactory.branches,
            validate: notEmpty
        },
        {
            type: 'autocomplete',
            name: 'target_branch',
            message: 'Target branch:',
            pageSize: 10,
            source: gitlabFactory.branches,
            validate: notEmpty
        },
        {
            type: 'input',
            name: 'title',
            message: 'Title:',
            default: 'Merge',
            validate: notEmpty
        },
        {
            type: 'list',
            name: 'codeReview',
            message: 'Code Review?',
            choices: [
                'Sim',
                'Nao'
            ],
            filter: value => value == 'Sim'
        },
        {
            type: 'list',
            name: 'buildJenkins',
            message: 'Build jenkins?',
            choices: [
                'Sim',
                'Nao'
            ],
            filter: value => value == 'Sim',
            when: answers => !answers.codeReview
        }
    ])
    .then(async answers => {
        try {
            const [projeto] = await gitlabFactory.search(answers.projeto)
            const merge = await gitlabFactory.mergeRequest(projeto.id, answers.source_branch, answers.target_branch, answers.title)

            if (answers.codeReview) {
                const text = `Code review - ${answers.title} - ${merge.web_url}/diffs <!here> :top:`
                sendMessage(text)
                return
            }

            await gitlabFactory.merge(projeto.id, merge.iid)

            if (answers.buildJenkins) {
                jenkinsFactory.build(answers.projeto, answers.target_branch)

                let statusBuild = setInterval(async () => {
                    const build = await jenkinsFactory.statusBuild(answers.projeto, answers.target_branch)

                    jenkinsFactory.statusBuildFull(answers.projeto, answers.target_branch)

                    if (build.result) {
                        notification.send(build.result, build.fullDisplayName, `${build.url}`)

                        clearInterval(statusBuild)
                    }
                }, 1000 * 5)

            }
        } catch (error) {
            console.error(error.response.data)
        }
    });
