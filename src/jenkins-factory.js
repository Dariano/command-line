const request = require('axios')
const colors = require('colors');
const _ = require('lodash')

require('dotenv').config({
    path: `${__dirname}/../.env`
})

var jenkins = require('jenkins')({
    baseUrl: `https://${process.env.USER_JENKINS}:${process.env.TOKEN_JENKINS}@jenkins-arq.e-unicred.com.br`,
    crumbIssuer: false,
    promisify: true
});

class JenkinsFactory {

    // async build(projeto, branch) {

    //     await this.updateBranchs(projeto)

    //     shell.exec(`curl --silent -X POST ${process.env.URL_JENKINS}/job/${projeto}/job/${branch}/build\?TOKEN\=${process.env.TOKEN_JENKINS} \
    //                 --user ${process.env.USER_JENKINS}:${process.env.TOKEN_JENKINS} \
    //                 --data-urlencode json='{
    //                         "parameter": [
    //                             {"name":"buildRefresh", "value":"1"},
    //                             {"name":"email", "value":"governanca.ti@agib@nk.com.br"},
    //                             {"name":"replicas", "value":"1"}
    //                         ]
    //                     }'`)
    // }

    // async build(projeto, branch) {
    //     const url = `${process.env.URL_JENKINS}/job/${projeto}/job/${branch}/build`
    //     const credenciais = Buffer.from(`${process.env.USER_JENKINS}:${process.env.TOKEN_JENKINS}`).toString('base64')

    //     const config = {
    //         headers: {
    //             'Authorization': `Basic ${credenciais}`,
    //             'Content-Type': 'application/x-www-form-urlencoded'
    //         }
    //     }

    //     const body = {}

    //     return request
    //         .post(url, body, config)
    //         .then(res => res.data)
    // }

    build(projeto, versao) {
        let parameters = {
            'K8S_USERNAME': process.env.K8S_USER_UN,
            'K8S_PASSWORD': credentialsK8s()
        }

        if(versao) {
            parameters.appVersion = versao
        }

        return jenkins.job.build({ name: projeto, parameters })
    }

    statusBuild(projeto, buildId) {
        return jenkins.build
            .get(projeto, buildId)
            .catch(() => ({
                result: ''
            }))
    }

    // statusBuild(projeto, branch) {
    //     const url = `${process.env.URL_JENKINS}/job/${projeto}/job/${branch}/lastBuild/api/json`
    //     const credenciais = Buffer.from(`${process.env.USER_JENKINS}:${process.env.TOKEN_JENKINS}`).toString('base64')

    //     const config = {
    //         headers: {
    //             'Authorization': `Basic ${credenciais}`
    //         }
    //     }

    //     return request
    //         .post(url, {}, config)
    //         .then(res => res.data)
    //         .catch(e => console.log(e.response.data))
    // }

    async statusBuildFull(projeto, branch) {
        const url = `${process.env.URL_JENKINS}/view/USA/job/${projeto}/job/${branch}/wfapi/runs?since=%2355&fullStages=true`
        const credenciais = Buffer.from(`${process.env.USER_JENKINS}:${process.env.TOKEN_JENKINS}`).toString('base64')

        const config = {
            headers: {
                'Authorization': `Basic ${credenciais}`
            }
        }

        const stages = await request
            .post(url, {}, config)
            .then(res => res.data)
            .then(build => {
                const stages = build[0].stages
                return stages.map(s => {
                    return {
                        name: s.name,
                        status: s.status,
                        statusBuild: build.status
                    }
                })
            })
            .catch(e => Promise.resolve([]))

        message(projeto, stages)

        return stages
    }

    search(answers, input) {
        if (!input || input.length < 3) return Promise.resolve([])

        const url = `${process.env.URL_JENKINS}/search/suggest?query=${input}`
        const credenciais = Buffer.from(`${process.env.USER_JENKINS}:${process.env.TOKEN_JENKINS}`).toString('base64')

        const config = {
            headers: {
                'Authorization': `Basic ${credenciais}`
            }
        }

        return request
            .get(url, config)
            .then(res => res.data.suggestions)
    }

    updateBranchs(projeto) {
        const url = `${process.env.URL_JENKINS}/view/USA/job/${projeto}/build?delay=0`
        const credenciais = Buffer.from(`${process.env.USER_JENKINS}:${process.env.TOKEN_JENKINS}`).toString('base64')

        const config = {
            headers: {
                'Authorization': `Basic ${credenciais}`
            }
        }

        return request
            .post(url, {}, config)
            .then(res => res.data)
            .catch(e => console.log('Erro, update branch'))
    }

    async getAppVersion({projeto}, input) {
        const job = await jenkins.job.get(projeto)

        const url = `${job.url}/descriptorByName/net.uaznia.lukanus.hudson.plugins.gitparameter.GitParameterDefinition/fillValueItems?param=appVersion`

        const credenciais = Buffer.from(`${process.env.USER_JENKINS}:${process.env.TOKEN_JENKINS}`).toString('base64')

        const config = {
            headers: {
                'Authorization': `Basic ${credenciais}`
            }
        }

        return request
            .post(url, {}, config)
            .then(res => res.data.values.filter(versions => versions.value.includes(input)).map(versions => versions.value))
            .catch(e => console.log('Erro, update branch'))
    }

    getJob(nomeProjeto) {
        return jenkins.job.get(nomeProjeto);

    }
}

const credentialsK8s = () => {
    return Buffer.from(process.env.K8S_KEY_UN, 'base64').toString('ascii')
}

let statusProjectsJenkins = []
const message = (projeto, stages) => {
    if (stages.length < 1) return

    const stage = stages.pop()
    if (statusProjectsJenkins.length > 0 && statusProjectsJenkins.some(isNotify(projeto, stage))) return statusProjectsJenkins

    console.log(`${projeto} - ${colors.yellow(stage.name)} - ${colors.green(stage.status)}`)

    statusProjectsJenkins = statusProjectsJenkins.filter(isNotify(projeto, stage))
    statusProjectsJenkins.push({
        projeto: projeto,
        stageName: stage.name,
        status: stage.status
    })
}

const isNotify = (projeto, stage) =>
    n => n.projeto == projeto && n.stageName == stage.name && n.status == stage.status

module.exports = new JenkinsFactory()