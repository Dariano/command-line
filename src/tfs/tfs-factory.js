const request = require('axios')
require('dotenv').config({
    path: `${__dirname}/../../.env`
})

const { VstsClient, VstsConfiguration } = require('vsts-api')

const token = process.env.TOKEN_TFS
const url = process.env.URL_TFS + '/Unicred'
const username = process.env.USER_TFS

const print = async () => { 
    let configuration = new VstsConfiguration(url, username, token);
    let client = VstsClient.createFromConfiguration(configuration);

    let proj = await client.project.getProject()
    console.log('>>>>>>>>>>>', proj)
}

print()