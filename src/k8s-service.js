const k8s = require('@kubernetes/client-node');
const _ = require('lodash')
const request = require('axios')

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

class K8s {

    listNameNamespaces(ambiente, filter) {
        kc.setCurrentContext(ambiente);
        const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

        return k8sApi.listNamespace()
            .then(res => {
                const items = res.body['items']
                return items
                    .filter(service => service.metadata.name.includes(filter))
                    .map(service => service.metadata.name)
            })
    }

    listNameServices(ambiente, namespace, filter) {
        kc.setCurrentContext(ambiente);
        const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

        return k8sApi.listNamespacedService(namespace)
            .then(res => {
                let items = res.body['items']

                if (filter) {
                    items = items.filter(service => service.metadata.name.includes(filter))
                }

                return items
                    .map(service => {
                        return {
                            name: service.metadata.name,
                            port: service.spec.ports[0].nodePort
                        }
                    })
            })
    }

    async monitoreServices(ambiente, namespace, services) {
        kc.setCurrentContext(ambiente);
        const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
        const pods = await k8sApi.listNamespacedPod(namespace).then(res => res.body['items'])
        const statusPods = pods
            .filter(pod => services.some(service => _.startsWith(pod.metadata.name, service.name)))
            .map(pod => {
                return {
                    name: pod.metadata.name,
                    app: pod.metadata.labels.app,
                    ready: pod.status.containerStatuses[0].ready,
                    nodeName: pod.spec.nodeName
                }
            })

        const allServices = await Promise.all(services
            .map(async (service) => {
                const podsFilter = statusPods.filter(pod => pod.app == service.name)
                const serviceReady = podsFilter.every(pod => pod.ready == true)

                let url = `https://servicos-${ambiente}.e-unicred.com.br/${service.name}/management/health`

                if(!!service.port && podsFilter.length && podsFilter[0].nodeName) {
                    url = `http://${podsFilter[0].nodeName}:${service.port}/management/health`
                }
                
                if (serviceReady && checkServiceUp(url, service)) {
                    service.spinner.succeed(service.name)
                    return
                }

                return service
            }))
        
        return allServices.filter(service => !!service)
    }
}

const checkServiceUp = async (url, service) => {
    try {
        await request.get(url)
        return true
    } catch (error) {
        const status = error.response.status
        service.spinner.fail(`${service.name} - ${url} - ${ status}`)
        return status < 500
    }
}

module.exports = new K8s()