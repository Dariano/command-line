const { sendMessage } = require('./slack')
const shell = require('shelljs')
const notifier = require('node-notifier');

class Notification {
    async send(result, url) {
        const message = `${result} - ${url}console`
        console.log(message)
        await sendMessage(message)
        notifier.notify({
            title: 'Build Jenkins',
            message: message
        });
    }

    sendStatus(message) {
        sendMessage(message, 'usa-build-jenkins')
        notifier.notify({
            title: 'Service',
            message: message
        });
    }
}

module.exports = new Notification()
