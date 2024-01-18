const fetch = (...args) =>
	import('node-fetch').then(({default: fetch}) => fetch(...args));
const express = require('express')
const router = express.Router()
require('dotenv').config()

//use geo api to get lat and long from zip code
async function getLatLong(zip) {
    const GEO_API_URL = 'https://api.openweathermap.org/geo/1.0/zip?zip=' + zip + '&appid=' + process.env.WEATHER_API_KEY;
   
    const request = await fetch(GEO_API_URL);
    const data = request.json();
    return data;
}

/**
 * @api {get} /zipConverter Request for latitude and longitude from zip code user input
 * @apiName GetLatLong
 * @apiGroup Weather
 */
router.post('/', async (request, response, next) => {
    getLatLong(request.body.zip)
        .then((location) => {
            //Retrieve lat and long
            const result = 
                {
                    latitude: location.lat, //Latitude
                    longitude: location.lon, //Longitude
                    cityName: location.name
                }

            console
            response.json(result);
        })
        .catch((error) => {
            console.error(error);
            response.status(400).json({
                msg:"Error! Could not retrieve latitude and longitude",
                error
            })
        }
    );
})
module.exports = router