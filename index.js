const telegramApi = require('node-telegram-bot-api');
const config = require('config');
const axios = require('axios');
const request = require('request');

const token = config.get('token');
const weather_token = config.get('w_token');
const population_token = config.get('p_token');
const weatherEndpoint = (city) =>
  `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&&appid=${weather_token}`;
const worldClock = (city) =>
  `http://worldtimeapi.org/api/timezone/Europe/${city}`;

const bot = new telegramApi(token, {
  polling: true,
});

const basic = () => {
  bot.on('polling_error', console.log);

  bot.setMyCommands([{
      command: '/start',
      description: 'Greeting',
    },
    {
      command: '/help',
      description: 'Display a list of possible commands'
    },
    {
      command: '/weather',
      description: 'Weather in your city',
    },
    {
      command: '/time',
      description: 'Actual time in city',
    },
    {
      command: '/population',
      description: 'Population in city',
    },
  ]);

  bot.on('message', async (msg, match) => {
    console.log(msg);
    const user = msg.from.first_name;
    const chatId = msg.chat.id;
    const text = msg.text;

    try {
      if (text === '/start') {
        await bot.sendMessage(
          chatId,
          'Welcome to City-Bot! Hope that we can make your life easier!'
        );
        await bot.sendSticker(
          chatId,
          'https://tlgrm.ru/_/stickers/88e/586/88e586f0-4299-313f-bedb-ef45c7710422/1.webp'
        );
        return bot.sendMessage(
          chatId,
          'Write "/help" to see available commands'
        );
      }
      if (text === '/help') {
        return bot.sendMessage(chatId, '/weather - Weather in your city\n' +
          '/time - Actual time in your city\n' +
          '/popoulation - Population in your city\n' +
          '/help - Commands list\n')
      }
    } catch (e) {
      console.log('error');
      bot.sendMessage(
        chatId,
        'Something went wrong :('
      );
    }
  });
};
basic();

const weatherIcon = (icon) => `http://openweathermap.org/img/w/${icon}.png`;

const weatherHtmlTemplate = (name, main, weather, wind, clouds) =>
  `The weather in <b>${name}</b>:
<b>${weather.main}</b> - ${weather.description}
Temperature: <b>${main.temp} °C</b>
Pressure: <b>${main.pressure} hPa</b>
Humidity: <b>${main.humidity} %</b>
Wind: <b>${wind.speed} meter/sec</b>
Clouds: <b>${clouds.all} %</b>
`;

const clockHTMLTemplate = (timezone, datetime) =>
  `The actual time in ${timezone} is ${datetime}`;

bot.onText(/\/time/, (msg, match) => {
  const chatId = msg.chat.id;
  const city = match.input.split(' ')[1];
  const endpoint = worldClock(city);

  if (city === undefined) {
    bot.sendMessage(
      chatId,
      `Please provide city name. For example (/time Kyiv)`
    );
    return;
  }
  try {
    axios.get(endpoint).then(
      async (resp) => {
        const {
          timezone,
          datetime
        } = resp.data;

        await bot.sendMessage(chatId, clockHTMLTemplate(timezone, datetime), {
          parse_mode: 'HTML',
        });
      })
  } catch (e) {
    console.log('error', error);
    bot.sendMessage(
      chatId,
      `Ooops...I couldn't be able to get time for <b>${city}</b>`, {
        parse_mode: 'HTML',
      }
    );
  }
});

bot.onText(/\/weather/, (msg, match) => {
  const chatId = msg.chat.id;
  const city = match.input.split(' ')[1];

  if (city === undefined) {
    bot.sendMessage(
      chatId,
      `Please provide city name. For example (/weather Kyiv)`
    );
    return;
  }
  const endpoint = weatherEndpoint(city);

  try {
    axios.get(endpoint).then(
      async (resp) => {
        const {
          name,
          main,
          weather,
          wind,
          clouds
        } = resp.data;

        await bot.sendPhoto(chatId, weatherIcon(weather[0].icon));

        return bot.sendMessage(
          chatId,
          weatherHtmlTemplate(name, main, weather[0], wind, clouds), {
            parse_mode: 'HTML',
          }
        );
      }
    )
  } catch (e) {
    console.log('error', error);
    bot.sendMessage(
      chatId,
      `Ooops...I couldn't be able to get weather for <b>${city}</b>`, {
        parse_mode: 'HTML',
      }
    );
  }
});

bot.onText(/\/population/, (msg, match) => {
  const chatId = msg.chat.id;
  const name = match.input.split(' ')[1];

  request.get({
      url: 'https://api.api-ninjas.com/v1/city?name=' + name,
      headers: {
        'X-Api-Key': `${population_token}`,
      },
    },
    function (error, response, body) {
      if (error) return console.error('Request failed:', error);
      else if (response.statusCode != 200)
        return console.error(
          'Error:',
          response.statusCode,
          body.toString('utf8')
        );
      else bot.sendMessage(chatId, `The population is ${body.slice(93, 102)}`);
    }
  );
});