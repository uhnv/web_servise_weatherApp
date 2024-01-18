//express is the framework we're going to use to handle requests
const express = require("express");
const { isStringProvided } = require("../utilities/validationUtils");

//Access the connection to Heroku Database
const pool = require("../utilities/exports").pool;

const generateHash = require("../utilities").generateHash;
const generateSalt = require("../utilities").generateSalt;

const router = express.Router();

/**
 * @api {post} /change/forget Request to change user's password with verify
 * @apiName forget
 * @apiGroup change
 *
 * @apiSuccess {boolean} success true when the password is changed
 * @apiSuccess {String} message: "Password successfuly changed"
 *
 *  * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "Password successfuly changed"
 *     }
 *
 * @apiError (400: Malformed Authorization Header) {String} message "Malformed Authorization Header"
 *
 * @apiError (404: Email Not Found) {String} message "Email not found"
 *
 */
router.post('/forget', (request, response, next) => {

    const email = request.body.email;
    const password = request.body.password;

    if (!isStringProvided(email) || !isStringProvided(password)) {
        return response.status(400).send({
            message: "Malformed Authorization Header"
        });
    } else {
        next();
    }
},
(request, response) => {

    const email = request.body.email
    const password = request.body.password

    let salt = generateSalt(32);
    let salted_hash = generateHash(password, salt);

    let theQuery = "UPDATE CREDENTIALS AS c SET SaltedHash = $1, Salt = $2 FROM MEMBERS AS m WHERE c.MemberId = m.MemberId AND m.Email = $3";
    let value = [salted_hash, salt, email];
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
                    message: "Password successfuly changed"
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
 * @api {post} /change/new Request to change user's password with old password
 * @apiName new
 * @apiGroup change
 *
 * @apiSuccess {boolean} success true when the password is changed
 * @apiSuccess {String} message: "Password successfuly changed"
 *
 *  * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "Password successfuly changed"
 *     }
 *
 * @apiError (400: Malformed Authorization Header) {String} message "Malformed Authorization Header"
 * 
 * @apiError (404: User Not Found) {String} message "User not found"
 *
 * @apiError (404: Email Not Found) {String} message "Email not found"
 * 
 * @apiError (400: Invalid Credentials) {String} message "Credentials did not match"
 *
 */
router.post('/new', (request, response, next) => {

    const email = request.body.email;
    const oldPassword = request.body.oldPassword;
    const newPassword = request.body.newPassword;

    if (!isStringProvided(email) || !isStringProvided(oldPassword) || !isStringProvided(newPassword)) {
        return response.status(400).send({
            message: "Malformed Authorization Header"
        });
    } else {
        next();
    }
},
(request, response, next) => {

    const email = request.body.email;
    const oldPassword = request.body.oldPassword

    const theQuery = `SELECT saltedhash, salt, Credentials.memberid FROM Credentials
                      INNER JOIN Members ON
                      Credentials.memberid=Members.memberid 
                      WHERE Members.email=$1`;
    const values = [email];
    pool
        .query(theQuery, values)
        .then((result) => {
            if (result.rowCount == 0) {
                response.status(404).send({
                    message: "User not found"
                });
                return;
            }

            let salt = result.rows[0].salt;
            let storedSaltedHash = result.rows[0].saltedhash;
            let providedSaltedHash = generateHash(oldPassword, salt);

            if (storedSaltedHash === providedSaltedHash) {
                next();
            } else {
                response.status(400).send({
                    message: "Credentials did not match"
                });
            }
        })
        .catch((err) => {
            //log the error
            response.status(400).send({
                message: err.detail
            });
        });
},
(request, response) => {

    const email = request.body.email
    const newPassword = request.body.newPassword

    let salt = generateSalt(32);
    let salted_hash = generateHash(newPassword, salt);

    let theQuery = "UPDATE CREDENTIALS AS c SET SaltedHash = $1, Salt = $2 FROM MEMBERS AS m WHERE c.MemberId = m.MemberId AND m.Email = $3";
    let value = [salted_hash, salt, email];
    pool
        .query(theQuery, value)
        .then((result) => {
            console.log(result.rows[0])
            if (result.rowCount == 0) {
                return response.status(404).send({
                    message: "Email not found"
                });
            } else {
                return response.status(200).send({
                    success: true,
                    message: "Password successfully changed"
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