const fetch = (...args) =>
	import('node-fetch').then(({default: fetch}) => fetch(...args));
const express = require('express')
const router = express.Router()
require('dotenv').config()

async function getWeather(lat, long) {
    const WEATHER_API_URL = 'https://api.openweathermap.org/data/3.0/onecall?lat='  + lat + '&lon=' + long + '&exclude=minutely,alerts,current,hourly&units=imperial&appid=' + process.env.WEATHER_API_KEY
    const request = await fetch(WEATHER_API_URL);
    const data = request.json();
    return data;
}

/**
 * @api {get} /weeklyWeather Request for 8 days of weather data
 * @apiName WeeklyWeather
 * @apiGroup Weather
 */ 
router.post('/', async (request, response) => {

    getWeather(request.body.latitude, request.body.longitude)
        .then((weather) => {
            
            // response.json(weather); //whole daily JSON
            // console.log(weather); //print response
            // console.log(weather.daily.length); // pring length of the list in daily 

            const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

            const weatherData = weather.daily.map((dayData) => {
              const timestamp = dayData.dt * 1000; // Convert seconds to milliseconds
              const date = new Date(timestamp);
              const dayOfWeek = daysOfWeek[date.getDay()]; // Get day of the week
            
              const result = {
                day: dayOfWeek,
                temperature: `${Math.round(dayData.temp.day)} ${'°F'}`, // Round temperature
                skyCondition: dayData.weather[0].main,
                windSpeed: `${Math.round(dayData.wind_speed)} ${'mph'}`, // Round wind speed
              };
      
              return result;
              
            });
      
            // console.log(weatherData);
            response.json(weatherData);
        })
        .catch((error) => {
            console.error(error);
            response.status(400).json({
                msg:"Could not retrieve weather info",
                error
            })
        });
})
module.exports = router