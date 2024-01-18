//express is the framework we're going to use to handle requests
const express = require("express");
const { isStringProvided } = require("../utilities/validationUtils");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
//Access the connection to Heroku Database
const pool = require("../utilities").pool;

const router = express.Router();

// Sendgrind
// const nodemailerSendgrid = require('nodemailer-sendgrid');
// const transport = nodemailer.createTransport(
//     nodemailerSendgrid({
//         apiKey: process.env.SENDGRID_API_KEY
//     })
// );

/**
 * @api {post} /verify/send Request to send a email and store verification code
 * @apiName send
 * @apiGroup verify
 * 
 * @apiSuccess {String} message: "Email successfully sent"
 *
 *  * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "message": "Email successfully sent"
 *     }
 *
 * @apiError (400: Malformed Authorization Header) {String} message "Malformed Authorization Header"
 *
 */
router.post("/send", async (request, response) => {
    
    try {
        const email = request.body.email;

        if (!isStringProvided(email)) {
            return response.status(400).send({
                message: "Malformed Authorization Header",
            });
        }
    
        const transport = nodemailer.createTransport({
            host: 'smtp.qq.com',
            port: 465,
            auth: {
                user: '919848043@qq.com',
                pass: 'wnjzjgofttpgbdac'
            }
        });
    
        const pin = await new Promise((resolve, reject) => crypto.randomBytes(3, function(err, buffer) {
            resolve(parseInt(buffer.toString('hex'), 16).toString().substr(0,6));
        }));
    
        let theQuery = 'UPDATE MEMBERS SET VerificationCode = $1 WHERE Email = $2'
        let value = [pin, email];
        const result = await pool.query(theQuery, value);

        // if (result.rows.length == 0) {
        //     return response.status(200).json({
        //         message: "email successfully sent"
        //     })
        // }
    
        const a = await transport.sendMail({
            from: "919848043@qq.com",
            to: email,
            subject: "Email Verification",
            text: "Here is your verification code: " + pin,
            html: `<p> Here is your verification code: ${pin} </p>`
        })
    
        return response.status(200).json({
            message: "Email successfully sent"
        })

    } catch (e) {
        return response.status(400).json({
            error: e
        })
    }
})

/**
 * @api {post} /verify/check Request to check if the virificaiton code match
 * @apiName check
 * @apiGroup verify
 *
 * @apiSuccess {boolean} success true when the name is returned
 * @apiSuccess {String} message: "Verification success"
 *
 *  * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "message": "Verification success"
 *     }
 *
 * @apiError (400: Malformed Authorization Header) {String} message "Malformed Authorization Header"
 *
 * @apiError (400: Pin Not Match) {String} message "Pin did not match"
 *
 */
router.post("/check", (request, response, next) => {

    const email = request.body.email;
    const pin = request.body.pin;

    let theQuery = "SELECT * FROM MEMBERS WHERE Email = $1";
    let value = [email];
    pool
        .query(theQuery, value)
        .then((result) => {
            if (result.rowCount == 0) {
                return response.status(400).send({
                    message: "Pin did not match"
                });
            }

            if (result.rows[0].verificationcode != pin) {
                return response.status(400).send({
                    message: "Pin did not match"
                });
            }
            next();
        })
        .catch((err) => {
            return response.status(400).send({
                message: err.detail
            });
        });
},
(request, response) => {

    const email = request.body.email;

    let theQuery = "UPDATE MEMBERS SET Verification = $1 WHERE Email = $2";
    let value = [1, email];
    pool
        .query(theQuery, value)
        .then((result) => {
            return response.status(200).send({
                success: true,
                message: "Verification success"
            })
        })
        .catch((err) =>{
            return response.status(400).send({
                message: err.detail
            });
        });
});

module.exports = router;