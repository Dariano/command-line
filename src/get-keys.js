const clipboardy = require('clipboardy');
const inquirer = require('inquirer')
const colors = require('colors')
require('dotenv').config({
    path: `${__dirname}/../.env`
})

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

const notEmpty = (value) => {
    if (value) return true

    return "Não pode ser vazio!"
}

inquirer
    .prompt([{
        type: 'autocomplete',
        name: 'key',
        message: 'Qual chave?',
        source: (answers, input) => {
            input = input || ""
            return Promise.resolve(
                [
                    'K8S_KEY_UN',
                    'REDE_UN',
                    'GMAIL',
                    'GRUPO_VPN'
                ].filter(key => key.includes(input.toUpperCase()))
            )
        },
        validate: notEmpty
    }])
    .then(async (answers) => {
        const key = Buffer.from(process.env[answers.key], 'base64').toString('ascii')
        clipboardy.writeSync(key)
        console.log(`\n>>>>>>>>>>> Copiado o KEY para area de transferência!\n`.yellow)
    })