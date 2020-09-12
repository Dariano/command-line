const clipboardy = require('clipboardy');
const request = require('axios')
const inquirer = require('inquirer')
const querystring = require('querystring')
const colors = require('colors')
require('dotenv').config({
    path: `${__dirname}/../.env`
})

const notEmpty = (value) => {
    if (value) return true

    return "Não pode ser vazio!"
}

inquirer
    .prompt([
    ])
    .then(async (answers) => {
        const url = process.env.URL_AUTH_TCC

        const body = {
            username: process.env.USER_TCC,
            password: process.env.PASSWORD_TCC,
            grant_type: 'password'
        }

        const { data } = await request.post(url, querystring.stringify(body), {
            headers: { 'content-type': 'application/x-www-form-urlencoded', Authorization: 'Basic dGNjLWNsaWVudDp0Y2Mtc2VjcmV0' }
        }).catch((e) => console.error(e.response.status, e.response.data))

        console.log(`\n>>>>>>>>>>> Copiado o token para area de transferência!\n`.yellow)
        console.log(`Bearer ${data.access_token}`.green)
        clipboardy.writeSync(`Bearer ${data.access_token}`);
    })