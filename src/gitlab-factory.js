const request = require('axios')
require('dotenv').config({
    path: `${__dirname}/../.env`
})

const jenkins = require('jenkins')({ 
    baseUrl: `http://${process.env.USER_JENKINS}:${process.env.TOKEN_JENKINS}@${process.env.HOST_JENKINS}`, 
    crumbIssuer: true 
});

const parans = { 
    name: 'usa-profile-service/hlg', 
    parameters: { 
        buildRefresh: 1,
        email: 'governanca.ti@agib@nk.com.br',
        replicas: 1
    } 
}

const config = {
    headers: {
        'PRIVATE-TOKEN': process.env.TOKEN_GITLAB,
        'Accept': 'application/json'
    }
}

let that = {}

class GitlabFactory {
    constructor() {
        that = this
    }

    async branches(answers, input) {
        try {
            if (!input) return Promise.resolve([])
            const [project] = await that.projetos({}, Array.isArray(answers.projetos) ? answers.projetos[0] : answers.projeto)
            const URL = `${process.env.URL_GITLAB}/api/v4/projects/${project.id}/repository/branches`

            const {data} = await request.get(URL, config)
            const projects = data.filter(project => project.name.includes(input))
            return projects.map(project => project.name)
        } catch (error) {
            return Promise.resolve(['dev', 'hlg', 'master'])
        }
    }

    async projetos(answers, input) {
        if (!input || input.length < 3)
            return Promise.resolve([])

        try {
            const { data } = await request.get(`${process.env.URL_GITLAB}/api/v4/projects?search=${input}`, config)
            return data
        } catch (error) {
            return Promise.resolve([])
        }
    }

    mergeRequest(id, sourceBranch, targetBranch, title) {
        const url_merge_request = `${process.env.URL_GITLAB}/api/v4/projects/${id}/merge_requests`
        const body = {
            "id": id,
            "source_branch": sourceBranch,
            "target_branch": targetBranch,
            "title": title
        }

        return request
            .post(url_merge_request, body, config)
            .then(res => res.data)
    }

    search(project) {
        const url = `${process.env.URL_GITLAB}/api/v4/projects?search=${project}`
        return request
            .get(url, config)
            .then(res => res.data)
    }

    merge(id, iid) {
        const url_approve = `${process.env.URL_GITLAB}/api/v4/projects/${id}/merge_requests/${iid}/merge`
        return request.put(url_approve, {
            'id': id,
            'merge_request_iid': iid
        }, config)
    }

    create(name, namespace_id) {
        const url = `${process.env.URL_GITLAB}/api/v4/projects`

        const body = {
            visibility: 'private',
            name: name,
            namespace_id: namespace_id
        }

        return request.post(url, body, config)
    }

    namespaces(answers, input) {
        const url = `${process.env.URL_GITLAB}/api/v4/namespaces?search=${input}`

        return request
                    .get(url, config)
                    .then(res => res.data)
                    .then(namespaces => namespaces.map(n => `[${ n.id }] ${ n.name }`))
    }
}

module.exports = new GitlabFactory()