require('dotenv').config({
    path: `${__dirname}/../.env`
})
const { WebClient } = require('@slack/web-api');
const web = new WebClient(process.env.TOKEN_SLACK);

module.exports = {
    sendMessage: (text, to = process.env.GROUP_SLACK) => {
        return web.chat.postMessage({ channel: to, text: text, as_user: true });
    }
}