const fetch = (...args) =>
	import('node-fetch').then(({default: fetch}) => fetch(...args));
const express = require('express')
const router = express.Router()
require('dotenv').config()

//the function to retrieve the current weather, it takes in latitude and longitude parameters
async function getCurrentWeather(long, lat) {
    const WEATHER_API_URL = 'https://api.openweathermap.org/data/3.0/onecall?lat=' + lat + '&lon=' + long + '&exclude=minutely,alerts,daily,hourly&units=imperial&appid=' + process.env.WEATHER_API_KEY;
    const request = await fetch(WEATHER_API_URL);
    const data = request.json();
    return data;
}

/**
 * @api {get} /currentWeather Request for current weather data
 * @apiName GetCurrentWeather
 * @apiGroup Weather
 */
router.post('/', async (request, response) => {
    getCurrentWeather(request.body.longitude, request.body.latitude)
        .then((results) => {
            //Retrieve temp and conditions
            //round temp to nearest whole number
            const temp = Math.round(results.current.temp);
            //TEST to get whole JSON
            // response.json(results);
            // console.log(results.current.weather.length); //print length of the list in JSON response

            const result = 
                {
                    temperature: temp,
                    conditions: results.current.weather[0].main
                }

            // console.log(result);
            // console.log(results.current.weather.length);
            response.json(result);
        })
        .catch((error) => {
            console.error(error);
            response.status(400).json({
                msg:"Could not retrieve current weather info",
                error
            })
        });
})
module.exports = router