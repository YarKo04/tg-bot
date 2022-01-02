const tgApi = require('node-telegram-bot-api')

const token = ''

const bot = new tgApi(token, {polling: true})

bot.on('message', msg => {
    console.log(msg)
})