const telegramApi = require('node-telegram-bot-api');
const config = require('config');

const token = config.get('token');

const bot = new telegramApi(token, {
  polling: true,
});

const begin = () => {
  bot.on('polling_error', console.log);

  bot.setMyCommands([
    {
      command: '/start',
      description: 'Greeting',
    },
    {
      command: '/info',
      description: 'Information',
    },
  ]);

  bot.on('message', async (msg) => {
    console.log(msg);
    const user = msg.from.first_name;
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text === '/start') {
      await bot.sendMessage(
        chatId,
        'Welcome to Smart-Bot! Hope that we can make your life easier!'
      );
      return bot.sendSticker(
        chatId,
        'https://tlgrm.ru/_/stickers/88e/586/88e586f0-4299-313f-bedb-ef45c7710422/1.webp'
      );
    }

    if (text === '/info') {
      return bot.sendMessage(chatId, `Your name is:  ${user}`);
    }
    return bot.sendMessage(chatId, 'I dont understand you :( ');
  });
};

begin();
