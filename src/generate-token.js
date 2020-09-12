const clipboardy = require('clipboardy');
const request = require('axios')
const inquirer = require('inquirer')
const querystring = require('querystring')
const colors = require('colors')
const jwt = require('jsonwebtoken')
require('dotenv').config({
    path: `${__dirname}/../.env`
})

const notEmpty = (value) => {
    if (value) return true

    return "Não pode ser vazio!"
}

inquirer
    .prompt([
        {
            type: 'list',
            name: 'tipo',
            message: 'Qual token?',
            choices: [
                'Authorization',
                'Legado'
            ]
        },
        {
            type: 'list',
            name: 'ambiente',
            choices: ['tst', 'hlg', 'prd', 'facilita'],
            default: 'tst',
            message: 'Ambiente:',
            validate: notEmpty
        },
        {
            type: 'input',
            name: 'user',
            default: 'camila',
            message: 'User:',
            validate: notEmpty
        },
        {
            type: 'input',
            name: 'cooperativa',
            default: '0566',
            message: 'Cooperativa:',
            // validate: notEmpty
        },
        {
            type: 'password',
            name: 'password',
            default: '123456',
            message: 'Password:',
            validate: notEmpty,
            when: answers => answers.tipo == 'Authorization'
        }        
    ])
    .then(async (answers) => {
        const username = answers.user// `${answers.user}.${answers.cooperativa}`
        const password = answers.password

        const secret = {
            tst: {
                clientSecret: process.env.CLIENT_SECRET_TST_UN,
                url: process.env.URL_AUTH_TST_UN,
                tokenLegacy: process.env.TOKEN_LEGACY_KEY_TST
            },
            hlg: {
                clientSecret: process.env.CLIENT_SECRET_HLG_UN,
                url: process.env.URL_AUTH_HLG_UN,
                tokenLegacy: process.env.TOKEN_LEGACY_KEY_HLG
            },
            prd: {
                clientSecret: process.env.CLIENT_SECRET_PRD_UN,
                url: process.env.URL_AUTH_PRD_UN,
                tokenLegacy: process.env.TOKEN_LEGACY_KEY_PRD
            },
            facilita: {
                clientSecret: process.env.CLIENT_SECRET_FACILITA_UN,
                url: process.env.URL_AUTH_FACILITA_UN,
                tokenLegacy: process.env.TOKEN_LEGACY_KEY_TST
            }
        }

        if (!secret[answers.ambiente].clientSecret) {
            console.error(`O ${'client_secret'.yellow} não está configurado no ambiente de ${answers.ambiente.yellow}.`)
            return
        }

        try {
            if (answers.tipo == 'Legado') {
                const token = tokenLegacy(username, answers.cooperativa, secret[answers.ambiente].tokenLegacy)
                clipboardy.writeSync(token);
            } else {
                const token = await createTokenAuthorization(username, password, answers.ambiente, secret)
                clipboardy.writeSync(`Bearer ${token}`);
            }

            console.log(`>>>>>>>>>>> Copiado o token para area de transferência!\n`.yellow)
        } catch (e) {
            console.error(e.response.status, e.response.data)
        }
    })

const tokenLegacy = (username, cooperativa, securityKey) => {
    return jwt.sign({
        cdUsuario: username,
        cdUsuarioSistema: 'SMLCRED',
        cdCooperativa: cooperativa,
        cdCooperativaCentral: cooperativa,
        sub: 'Pre-aprovado'
    }, Buffer.from(validarChave(securityKey), 'base64'));
}

const createTokenAuthorization = (username, password, ambiente, secret) => {
    const body = {
        client_id: `${ambiente}-client`,
        client_secret: secret[ambiente].clientSecret,
        username,
        password,
        grant_type: 'password'
    }

    const config = {
        headers: {
            'content-type': 'application/x-www-form-urlencoded'
        }
    }
    return request
            .post(secret[ambiente].url, querystring.stringify(body), config)
            .then(res => res.data.access_token)
}

const validarChave = (key) => {
    if(!key) throw new Error("Jwt key não existe.")

    let resto = key.length % 4
    let tamanhoDaChaveValida = key.length - resto

    return key.substring(0, tamanhoDaChaveValida)
} 