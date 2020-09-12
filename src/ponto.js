'use strict';
const inquirer = require('inquirer')
const moment = require('moment')


const notEmpty = (value) => {
    if (value) return true

    return "Não pode ser vazio!"
}

const hourInvalid = (value) => {
    if (moment(value, 'HH:mm').isValid())
        return true;

    return 'Horário inválido, formato HH:mm'
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
            name: 'name',
            message: "Digite o nome:",
            validate: notEmpty
        },
        {
            type: 'password',
            message: 'Digite a senha:',
            name: 'password',
            mask: '*',
            validate: notEmpty
        },
        {
            type: 'input',
            name: 'data',
            message: "Qual a data:",
            validate: dateInvalid
        },
        {
            type: 'input',
            name: 'hora_inicio',
            message: "Horário inicio:",
            validate: hourInvalid
        },
        {
            type: 'input',
            name: 'hora_fim',
            message: "Horário fim:",
            validate: hourInvalid
        },
        {
            type: 'list',
            name: 'projeto',
            message: 'Qual o projeto?',
            choices: [
                'AGK-FE-US',
                'AGK-FE-US-HE'
            ]
        },
        {
            type: 'list',
            name: 'theme',
            message: 'Qual a atividade?',
            choices: [
                'EN-DSV - Desenvolvimento (implementação, testes unitários e revisão de código)',
                'REU - Reunião',
                'ARQ-SET - Setup de Arquitetura'
            ]
        },
        {
            type: 'input',
            name: 'descricao',
            message: "Descrição:",
            validate: notEmpty
        }
    ])
    .then(answers => {
        console.log(JSON.stringify(answers, null, '  '));
    });
