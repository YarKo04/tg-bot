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
const population = (name) => `https://api.api-ninjas.com/v1/city?name=${name}`;

const bot = new telegramApi(token, {
  polling: true,
});

const basic = () => {
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
    {
      command: '/weather',
      description: 'Weather in your city',
    },
    {
      command: '/time',
      description: 'Actual time in city',
    },
  ]);

  bot.on('message', async (msg, match) => {
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

bot.onText(/\/population/, (msg, match) => {
  const chatId = msg.chat.id;
  const name = match.input.split(' ')[1];

  request.get(
    {
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
      else bot.sendMessage(chatId, body);
    }
  );
});

const getTime = (chatId, city) => {
  const endpoint = worldClock(city);

  axios.get(endpoint).then(
    (resp) => {
      const { timezone, datetime } = resp.data;

      bot.sendMessage(chatId, clockHTMLTemplate(timezone, datetime), {
        parse_mode: 'HTML',
      });
    },
    (error) => {
      console.log('error', error);
      bot.sendMessage(
        chatId,
        `Ooops...I couldn't be able to get time for <b>${city}</b>`,
        {
          parse_mode: 'HTML',
        }
      );
    }
  );
};

bot.onText(/\/time/, (msg, match) => {
  const chatId = msg.chat.id;
  const city = match.input.split(' ')[1];

  if (city === undefined) {
    bot.sendMessage(
      chatId,
      `Please provide city name. For example (/time Kyiv)`
    );
    return;
  }
  getTime(chatId, city);
});

const getWeather = (chatId, city) => {
  const endpoint = weatherEndpoint(city);

  axios.get(endpoint).then(
    (resp) => {
      const { name, main, weather, wind, clouds } = resp.data;

      bot.sendPhoto(chatId, weatherIcon(weather[0].icon));

      bot.sendMessage(
        chatId,
        weatherHtmlTemplate(name, main, weather[0], wind, clouds),
        {
          parse_mode: 'HTML',
        }
      );
    },
    (error) => {
      console.log('error', error);
      bot.sendMessage(
        chatId,
        `Ooops...I couldn't be able to get weather for <b>${city}</b>`,
        {
          parse_mode: 'HTML',
        }
      );
    }
  );
};

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
  getWeather(chatId, city);
});
