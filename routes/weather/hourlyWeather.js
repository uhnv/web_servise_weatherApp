const fetch = (...args) =>
	import('node-fetch').then(({default: fetch}) => fetch(...args));
const express = require('express')
const router = express.Router()
require('dotenv').config()

async function getWeather(long, lat) {
    const WEATHER_API_URL = 'https://api.openweathermap.org/data/3.0/onecall?lat=' + lat + '&lon=' + long + '&exclude=minutely,alerts,current,daily&cnt=8&units=imperial&appid=' + process.env.WEATHER_API_KEY;
    const request = await fetch(WEATHER_API_URL);
    const data = request.json();
    return data;
}

/**
 * @api {get} /HourlyWeather Request for 48hrs of weather info (trimmed to 24)
 * @apiName GetHourlyWeather
 * @apiGroup Weather
 */ 
router.post('/', async (request, response) => {

    getWeather(request.body.longitude, request.body.latitude)
        .then((weather) => {
            //trim the hourly array in JSON body to 24 items
            const hourly = weather.hourly.slice(0, 24);
            const hourlyWeather = {
                hourly: hourly
            };
            console.log(hourlyWeather); //TEST print trimmed data

            const hourlyData = hourlyWeather.hourly.map((hourData) => {
                const milliseconds = hourData.dt * 1000; // Convert seconds to milliseconds
                const dateObject = new Date(milliseconds);
                let hours = dateObject.getHours();
                let meridiem = "AM";

                if (hours >= 12) {
                meridiem = "PM";
                if (hours > 12) {
                    hours -= 12;
                }
                }
              
                const result = {
                    hour: `${hours} ${meridiem}`,
                    temperature: `${Math.round(hourData.temp)} ${'°F'}`, // Round temperature
                 
                };
        
                return result;
              });




            response.json(hourlyData);

        })

        .catch((error) => {
            console.error(error);
            response.status(400).json({
                msg:"Could not retrieve houry weather data",
                error
            })
        });
})
module.exports = router