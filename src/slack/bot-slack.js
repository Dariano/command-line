const SlackBot = require('slackbots');

require('dotenv').config({
    path: `${__dirname}/../../.env`
})

class Slack {
    constructor() {
        this.bot = new SlackBot({
            token: process.env.TOKEN_SLACK,
            name: process.env.NAME
        });
    }

    message(text) {
        try {
            var params = {
                icon_emoji: ':man-raising-hand:'
            };
            bot.postMessageToChannel('usa-build-jenkins', text, params);
        } catch (error) {

        }
    }
}


module.exports = new Slack()