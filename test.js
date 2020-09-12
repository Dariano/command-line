const request = require('axios')

const assert = () => {
    servicos.forEach(async (servico) => {
        const url = `https://servicos-tmg.e-unicred.com.br/${servico}/management/health`
        try {
            const {
                data
            } = await request.get(url)

            console.log(data.status)
    
            // if (!data['db']) {
            //     console.log('Não tem banco: ', servico)
            //     return
            // }
    
            console.log(servico, data['db'])
            
        } catch (error) {
            console.log(` >>>>>>>>>>> ${servico}`, error.response.status)
        }
    })
}

const k8s = require('@kubernetes/client-node');

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
kc.setCurrentContext('prd');

// kc.getContexts().forEach(context => {
//     console.log('>>>>>>>>>>>', context.cluster)

// })

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

// k8sApi.listNamespace()
//     .then(res => {
//         const items = res.body['items']
//         items.forEach(service => {
//             console.log(service.metadata.name);
//         })
//     })

k8sApi.listNode()
    .then(res => {
        const items = res.body['items']
        items.forEach(service => {
            console.log(service.metadata.name);
        })
    })
// k8sApi.connectHeadNamespacedServiceProxy('parceiro-us', 'credito', 'localhost:8081')
//     .then(res => {
        
//         const items = res.body['items']
//         items
//         // items.forEach(service => {
//         //     console.log(service.metadata.name);
//         // })
//     })
//     .catch(e => console.log(e.response))

// k8sApi.listNamespacedService('credito')
//     .then((res) => {
//         const items = res.body['items']
//         items.forEach(service => {
//             console.log(service);
//         })
//     });

// assert()

// k8sApi.listNamespacedPod('credito')
//     .then(res => {
//         const items = res.body['items']

//         // items
//         items.filter(item => item.metadata.labels.app == 'bndu-us').forEach(service => {
//             console.log(service);
//         })
//     })
//     .catch(e => console.log(e.response))

// k8sApi.readNamespacedPodStatus('credito-bff-node-5cc46dfc67-dst6q', 'credito')
//     .then(res => {
 
//         const items = res.body

//         console.log(items)
//         // items.forEach(service => {
//         //     console.log(service.metadata.name, service.status);
//         // })
//     })
//     .catch(e => console.log(e.response))

// k8sApi.listNamespacedService('credito')
//     .then(res => {
//         const items = res.body['items']

//         // console.log(items)
//         items.filter(item => item.metadata.labels.app == 'proposta-us').forEach(service => {
//             console.log(service.spec);
//         })
//     })
//     .catch(e => console.log(e.response))


// const appVersionJenkins = () => {
//     const namespace = 'Credito'
//     const ambiente = 'TST'
//     const projeto = 'contrato-ui'
//     const url = `https://jenkins-arq.e-unicred.com.br/${projeto}/job/${ambiente}/lastBuild/api/json`

//     const credenciais = Buffer.from(`dariano.pires:token`).toString('base64')

//     const config = {
//         headers: {
//             'Authorization': `Basic ${credenciais}`,
//         }
//     }

//     request.post(url, {}, config)
//         .then(res => {
//             console.log('>>>>>>>>>>>>>>', res.data)
//         })
//         .catch(error => {
//             error
//         })
// }

// const appVersionJenkins = () => {
//     const namespace = 'Credito'
//     const ambiente = 'TST'
//     const projeto = 'contrato-ui'
//     const url = `http://jenkins-arq.e-unicred.com.br/job/Servicos/job/Credito/job/credito-ui/job/BUILD/599/api/json`

//     const credenciais = Buffer.from(`dariano.pires:token`).toString('base64')

//     const config = {
//         headers: {
//             'Authorization': `Basic ${credenciais}`,
//         }
//     }

//     request.post(url, {}, config)
//         .then(res => {
//             console.log('>>>>>>>>>>>>>>', res.data)
//         })
//         .catch(error => {
//             error
//         })
// }

// appVersionJenkins(  )


// const jenkinsapi = require('jenkins-api');

// const jenkins = jenkinsapi.init(`https://dariano.pires:token@https://jenkins-arq.e-unicred.com.br`)

// jenkins.last_build_info('job-in-jenkins', function(err, data) {
//     if (err){ return console.log(err); }
//     console.log(data)
//   });

// var jenkins = require('jenkins')({
//     baseUrl: 'https://dariano.pires:token@jenkins-arq.e-unicred.com.br',
//     crumbIssuer: false,
//     promisify: false
// });

// jenkins.job.build({ name: 'Servicos/Credito/credito-web-bff/Build', parameters: { 'appVersion': 'origin/master' } } , function(err, data) {
//     if (err) throw err;
  
//     console.log('queue item number', data);
//   });

// jenkins.view.list(function(err, data) {
//     if (err) throw err;
  
//     console.log('views', data);
//   });

// jenkins.view.exists('AUTOMACAO-SAU', function(err, exists) {
//     if (err) throw err;
  
//     console.log('exists', exists);
//   });

// jenkins.queue.list(function(err, data) {
//     if (err) throw err;
  
//     console.log('queues', data);
//   });

// jenkins.job.list(function(err, data) {
//     if (err) throw err;
  
//     console.log('jobs', data);
//   });

// const print = async () => {
//    const a = await jenkins.job.get('Servicos/Credito/credito-web-bff/HLG')
//    a
// };
// print()

// jenkins.queue.list(function(err, data) {
//     if (err) throw err;
  
//     console.log('>>>>>', data);
//   });

// jenkins.build.get('Servicos/Credito/credito-ui/BUILD', 601, function (err, data) {
//     if (err) throw err;
    
//     console.log('log', data);
// });

// jenkins.info(function (err, data) {
//     if (err) throw err;

//     console.log('info', data);
// });