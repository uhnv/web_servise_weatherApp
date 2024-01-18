//express is the framework we're going to use to handle requests
const express = require("express");
const { isStringProvided } = require("../utilities/validationUtils");

//Access the connection to Heroku Database
const pool = require("../utilities").pool;

const router = express.Router();
let username;

/**
 * @api {post} /name/new Request to change user's username in the system
 * @apiName new
 * @apiGroup Name
 *
 * @apiSuccess {boolean} success true when the username is successfuly changed
 * @apiSuccess {String} message: "Username successfuly changed"
 *
 *  * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "Username successfuly changed"
 *     }
 *
 * @apiError (400: Malformed Authorization Header) {String} message "Malformed Authorization Header"
 *
 * @apiError (404: Email Not Found) {String} message "Email not found"
 *
 */
router.post("/new", (request, response, next) => {

    const email = request.body.email;
    const name = request.body.name;

    if (!isStringProvided(email) || !isStringProvided(name)) {
        return response.status(400).send({
            message: "Malformed Authorization Header"
        });
    } else {
        next();
    }
},
(request, response) => {

    const email = request.body.email;
    const name = request.body.name;

    let theQuery = "UPDATE MEMBERS SET Username = $1 WHERE Email = $2";
    let value = [name, email];
    pool
        .query(theQuery, value)
        .then((result) => {
            if (result.rowCount == 0) {
                return response.status(404).send({
                    message: "Email not found"
                });
            } else {
                return response.status(200).send({
                    success: true,
                    message: "Username successfuly changed"
                });
            }
        })
        .catch((error) => {
            //log the error
            return response.status(400).send({
                detail: error.detail
            });
        });
});

/**
 * @api {post} /name/current Request to view user's current username in the system
 * @apiName current
 * @apiGroup Name
 *
 * @apiSuccess {boolean} success true when the name is returned
 * @apiSuccess {String} username: username
 *
 *  * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "username": username
 *     }
 *
 * @apiError (400: Malformed Authorization Header) {String} message "Malformed Authorization Header"
 *
 * @apiError (404: Email Not Found) {String} message "Email not found"
 *
 */
router.post("/current", (request, response, next) =>{

    const email = request.body.email;

    if (!isStringProvided(email)) {
        return response.status(400).send({
            message: "Malformed Authorization Header"
        });
    } else {
        next();
    }
},
(request, response) => {

    const email = request.body.email;

    let theQuery = "SELECT * FROM MEMBERS WHERE Email = $1";
    let value = [email];
    pool
        .query(theQuery, value)
        .then((result) => {
            if (result.rowCount == 0) {
                return response.status(404).send({
                    message: "Email not found"
                });
            } else {
                username = result.rows[0].username;
                return response.status(200).send({
                    success: true,
                    name: username
                });
            }
        })
        .catch((error) => {
            //log the error
            return response.status(400).send({
                detail: error.detail
            });
        });
});

module.exports = router;