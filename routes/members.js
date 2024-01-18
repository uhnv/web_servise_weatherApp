//express is the framework we're going to use to handle requests
const express = require('express')

//Access the connection to Heroku Database
const pool = require('../utilities/exports').pool

const router = express.Router()

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */ 

/**
 * @api {get} /members Request to get the users with the given email, nickname, or first and last name
 * @apiName GetMembers
 * @apiGroup Members
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiParam {String} user to look up. 
 * 
 * @apiSuccess {Number} rowCount the number of users returned
 * @apiSuccess {Object[]} members List of members that match the search term
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 * @apiUse JSONError
 */ 
router.get("/:searchTerm", (request, response, next) => {
    //validate on missing or invalid (type) parameters
    if (!request.params.searchTerm) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else {
        next()
    }
},  (request, response) => {
        //Retrieve the members
        let query = `SELECT * 
                    FROM Members
                    WHERE Email=$1 OR Username=$1 OR FirstName=$1 OR LastName=$1`
        let values = [request.params.searchTerm]
        pool.query(query, values)
            .then(result => {
                response.send({
                    rowCount : result.rowCount,
                    rows: result.rows
                })
            }).catch(err => {
                response.status(400).send({
                    message: "SQL Error",
                    error: err
                })
            })
    }
);

module.exports = router