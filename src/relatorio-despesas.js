'use strict';
const inquirer = require('inquirer')
const moment = require('moment')


const notEmpty = (value) => {
    if (value) return true

    return "Não pode ser vazio!"
}

const dateInvalid = (value) => {
    if (moment(value, 'DD/MM/YYYY', true).isValid())
        return true;

    return 'Data inválida, formato DD/MM/YYYY'
}

inquirer
    .prompt([
       {
            type: 'input',
            name: 'data',
            message: "Qual a data:",
            default: moment().format('DD/M/Y'),
            validate: dateInvalid
        }
    ])
    .then(answers => {
        console.log(JSON.stringify(answers, null, '  '));
    });
