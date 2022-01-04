const telegramApi = require('node-telegram-bot-api');
const config = require('config');
const axios = require('axios');

const token = config.get('token');
const weather_token = config.get('w_token');
const weatherEndpoint = (city) => (
    `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&&appid=${weather_token}`
);

// URL that provides icon according to the weather
const weatherIcon = (icon) => `http://openweathermap.org/img/w/${icon}.png`;

// Template for weather response
const weatherHtmlTemplate = (name, main, weather, wind, clouds) => (
    `The weather in <b>${name}</b>:
<b>${weather.main}</b> - ${weather.description}
Temperature: <b>${main.temp} °C</b>
Pressure: <b>${main.pressure} hPa</b>
Humidity: <b>${main.humidity} %</b>
Wind: <b>${wind.speed} meter/sec</b>
Clouds: <b>${clouds.all} %</b>
`
);

const bot = new telegramApi(token, {
    polling: true,
});

const begin = () => {
    bot.on('polling_error', console.log);

    bot.setMyCommands([{
            command: '/start',
            description: 'Greeting',
        },
        {
            command: '/info',
            description: 'Information',
        },
        {
            command: '/weather',
            description: 'Weather in your city'
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

// Function that gets the weather by the city name
const getWeather = (chatId, city) => {
    const endpoint = weatherEndpoint(city);

    axios.get(endpoint).then((resp) => {
        const {
            name,
            main,
            weather,
            wind,
            clouds
        } = resp.data;

        bot.sendPhoto(chatId, weatherIcon(weather[0].icon))
        bot.sendMessage(
            chatId,
            weatherHtmlTemplate(name, main, weather[0], wind, clouds), {
                parse_mode: "HTML"
            }
        );
    }, error => {
        console.log("error", error);
        bot.sendMessage(
            chatId,
            `Ooops...I couldn't be able to get weather for <b>${city}</b>`, {
                parse_mode: "HTML"
            }
        );
    });
}

// Listener (handler) for telegram's /weather event
bot.onText(/\/weather/, (msg, match) => {
    const chatId = msg.chat.id;
    const city = match.input.split(' ')[1];

    if (city === undefined) {
        bot.sendMessage(
            chatId,
            `Please provide city name`
        );
        return;
    }
    getWeather(chatId, city);
});



begin();