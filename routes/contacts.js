//express is the framework we're going to use to handle requests
const express = require('express')
const { isValidEmail } = require('../utilities/validationUtils')

//Access the connection to Heroku Database
const pool = require('../utilities/exports').pool

const router = express.Router()

const validation = require('../utilities').validation
let isStringProvided = validation.isStringProvided


/**
 * @api {post} /contacts Request to add a user
 * @apiName PostContacts
 * @apiGroup Contacts
 * 
 * @apiDescription Adds the specified user from the user associated with the required JWT. 
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiParam {String} email the user to add 
 * 
 * @apiSuccess (Success 201) {boolean} success true when the email is inserted
 * 
 * @apiError (400: Unknown user) {String} message "Member ID not found"
 * 
 * @apiError (400: Unknown user) {String} message "Friend email not found"
 * 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: Invalid Parameters) {String} message "Missing email requirement"
 * 
 * @apiError (400: Request exists) {String} message "Contact incoming/outgoing exist"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 */ 
router.post("/", (request, response, next) => {
    console.log(request.body.email)
    const email = request.body.email
    if(isStringProvided(email)) {
        if(isValidEmail(email)) {
            //validate member id exists
            let query = 'SELECT * FROM Members WHERE memberid=$1'
            let values = [request.decoded.memberid]
            console.log(request.decoded.memberid);

            pool.query(query, values)
                .then(result => {
                    if (result.rowCount == 0) {
                        response.status(400).send({
                            message: "Member ID not found"
                        })
                    } else {
                        next()
                    }
                }).catch(error => {
                    response.status(400).send({
                        message: "SQL Error in member validation",
                        error: error
                    })
                })
        } else {
            response.status(400).send({
                message: "Missing valid email"
            })
        }
    } else {
        response.status(400).send({
            message: "Missing email requirement"
        })
    }
    }, (request, response, next) => {
        //validate the friendEmail exist
        let query = 'SELECT memberid FROM Members WHERE email = $1'
        let values = [request.body.email]

        pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(400).send({
                    message: "Friend email not found"
                })
            } else {
                request.params.friendId = result.rows[0].memberid
                console.log(request.params.friendId);
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error in contact validation",
                error: error
            })
        })
    },(request, response, next) => {
        //validate if there is no existing contact
        let query = "SELECT * FROM CONTACTS WHERE (memberid_a = $1 AND memberid_b = $2) OR (memberid_a = $2 AND memberid_b = $1)"
        let values = [request.decoded.memberid, request.params.friendId]
        pool.query(query, values)
            .then(result => {
                if(result.rowCount == 0) {
                    next()
                } else {
                    response.status(400).send({
                        message: "Contact incoming/outgoing exist"
                    })
                }

            }).catch(err => {
                //console.log(err)
                response.status(400).send({
                    message: "SQL Error in contact exist validation",
                    error: err
                })
            })

    },(request, response) => {
        //Add a contact request
        let query = 'INSERT INTO Contacts (primarykey, memberid_a, memberid_b, verified) VALUES (default, $1, $2, 0)'
        let values = [request.decoded.memberid, request.params.friendId]
        pool.query(query, values)
            .then(result => {
                if(result.rowCount == 0) {
                    response.status(400).send({
                        message: "Contact incoming/outgoing exist"
                    })
                } else {
                    //console.log(result.rows)
                    response.status(201).send({
                        success: true
                    })
                }
            }).catch(err => {
                //console.log(err)
                response.status(400).send({
                    message: "SQL Error in contact retrieve",
                    error: err
                })
            })
})


/**
 * @api {get} /contacts Request to get contacts
 * @apiName GetContacts
 * @apiGroup Contacts
 * 
 * @apiDescription Request to get all contacts associated with the JSON Web Token JWT that have been accepted
 *  
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiSuccess {Number} memberId the id of the user that made the request
 * @apiSuccess {Number} rowCount the number of contacts returned
 * @apiSuccess {Object[]} contacts List of contacts in the contacts table
 * @apiSuccess {String} contacts.FirstName The contact's first name
 * @apiSuccess {String} contacts.LastName The contact's last name
 * @apiSuccess {String} contacts.Nickname The contact's nickname
 * @apiSuccess {String} contacts.email The contact's email
 * @apiSuccess {Number} contacts.memberid_b The contact's id
 * 
 * @apiSuccess (Success 204) {String} message "No Contacts"
 * 
 * @apiError (400: Unknown user) {String} message "Member ID not found"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 */ 
router.get("/", (request, response, next) => {
    //validate member id exists
    let query = 'SELECT * FROM Members WHERE memberid=$1'
    let values = [request.decoded.memberid]
    
    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(400).send({
                    message: "Member ID not found"
                })
            } else {
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error in member validation",
                error: error
            })
        })
    }, (request, response) => {
        //Retrieve the member's contact
        let query = 'SELECT Members.FirstName, Members.LastName, Members.Username, Members.Email, MemberID_B FROM Contacts INNER JOIN Members ON Contacts.MemberID_B = Members.MemberID where Contacts.MemberID_A = $1 AND Contacts.verified = 1'
        let values = [request.decoded.memberid]

        pool.query(query, values)
            .then(result => {
                if (result.rowCount == 0) {
                    response.status(204).send({
                        message: "No Contacts"
                    })
                } else {
                    //console.log(result.rows)
                    response.send({
                        //memberid: request.decoded.memberid,
                        rowCount: result.rowCount,
                        rows: result.rows
                    })
                }
            }).catch(err => {
                //console.log(err)
                response.status(400).send({
                    message: "SQL Error in contact retrieve",
                    error: err
                })
            })
});

/**
 * @api {delete} /contacts/:friendID? Request delete a user from contact
 * @apiName DeleteContacts
 * @apiGroup Contacts
 * 
 * @apiDescription Does not delete the user associated with the required JWT but 
 * instead deletes the user based on the ID parameter.  
 * 
 * @apiParam {Number} friendID the ID to delete the user from
 * 
 * @apiSuccess (Success 200) {boolean} success true when the name is deleted
 * 
 * @apiError (404: Contact Not Found) {String} message "Contact does not exist"
 * @apiError (400: Invalid Parameter) {String} message "Malformed parameter. friendID must be a number" 
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 */ 
router.delete("/:friendID?", (request, response, next) => {
    //validate on empty parameters
    if (!request.params.friendID) {
        response.status(400).send({
            message: "Missing required information"
        })
    } else if (isNaN(request.params.friendID)) {
        response.status(400).send({
            message: "Malformed parameter. friendID must be a number"
        })
    } else {
        next()
    }
}, (request, response) => {
    //memberid_a = person making the call, memberid_b = the person to be removed
    let query = 'DELETE FROM Contacts WHERE (memberid_a=$1 AND memberid_b=$2) OR (memberid_a=$2 AND memberid_b=$1)'
    let values = [request.decoded.memberid, request.params.friendID]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(400).send({
                    message: "Contact does not exist"
                })
            } else {
                //console.log(result.rows)
                response.status(200).send({
                    success: true
                })
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error in delete contact",
                error: error
            })
        })
});

/**
 * @api {get} /contacts/sent Request to get outgoing contact
 * @apiName GetContacts
 * @apiGroup Contacts
 * 
 * @apiDescription Request to get all contacts associated with the JSON Web Token JWT that are outgoing
 *  
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiSuccess {Number} memberId the id of the user that made the request
 * @apiSuccess {Number} rowCount the number of contacts returned
 * @apiSuccess {Object[]} contacts List of contacts in the contacts table
 * @apiSuccess {String} contacts.FirstName The contact's first name
 * @apiSuccess {String} contacts.LastName The contact's last name
 * @apiSuccess {String} contacts.Nickname The contact's nickname
 * @apiSuccess {String} contacts.email The contact's email
 * @apiSuccess {Number} contacts.memberid_b The contact's id
 * 
 * @apiSuccess (Success 200) {String} message "No Contacts"
 * 
 * @apiError (400: Unknown user) {String} message "Member ID not found"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 */ 
router.get("/sent", (request, response, next) => {
    //validate member id exists
    let query = 'SELECT * FROM Members WHERE memberid=$1'
    let values = [request.decoded.memberid]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(400).send({
                    message: "Member ID not found"
                })
            } else {
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error in member validation",
                error: error
            })
        })
    }, (request, response) => {
        //Retrieve the member's contact
        let query = 'SELECT Members.FirstName, Members.LastName, Members.Username, Members.Email, MemberID_B FROM Contacts INNER JOIN Members ON Contacts.MemberID_B = Members.MemberID where Contacts.MemberID_A = $1 AND Contacts.verified = 0'
        let values = [request.decoded.memberid]
        
        pool.query(query, values)
            .then(result => {
                if (result.rowCount == 0) {
                    response.status(200).send({
                        message: "No Contacts"
                    })
                } else {
                    console.log(result.rows)
                    response.status(200).send({
                        //memberid: request.decoded.memberid,
                        rowCount: result.rowCount,
                        rows: result.rows
                    })
                }
            }).catch(err => {
                //console.log(err)
                response.status(400).send({
                    message: "SQL Error in contact retrieve",
                    error: err
                })
            })
});

/**
 * @api {get} /contacts/received Request to get incoming contact
 * @apiName GetContacts
 * @apiGroup Contacts
 * 
 * @apiDescription Request to get all contacts associated with the JSON Web Token JWT that are incoming
 *  
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiSuccess {Number} memberId the id of the user that made the request
 * @apiSuccess {Number} rowCount the number of contacts returned
 * @apiSuccess {Object[]} contacts List of contacts in the contacts table
 * @apiSuccess {String} contacts.FirstName The contact's first name
 * @apiSuccess {String} contacts.LastName The contact's last name
 * @apiSuccess {String} contacts.Nickname The contact's nickname
 * @apiSuccess {String} contacts.email The contact's email
 * @apiSuccess {Number} contacts.memberid_a The contact's id
 * 
 * @apiSuccess (Success 200) {String} message "No Contacts"
 * 
 * @apiError (400: Unknown user) {String} message "Member ID not found"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 */ 
router.get("/received", (request, response, next) => {
    //validate member id exists
    let query = 'SELECT * FROM Members WHERE memberid=$1'
    let values = [request.decoded.memberid]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(400).send({
                    message: "Member ID not found"
                })
            } else {
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error in member validation",
                error: error
            })
        })
    }, (request, response) => {
        //Retrieve the member's contact
        let query = 'SELECT Members.FirstName, Members.LastName, Members.Username, Members.Email, MemberID_A FROM Contacts INNER JOIN Members ON Contacts.MemberID_A = Members.MemberID where Contacts.MemberID_B = $1 AND Contacts.verified = 0;'
        let values = [request.decoded.memberid]

        pool.query(query, values)
            .then(result => {
                if (result.rowCount == 0) {
                    response.status(200).send({
                        message: "No Contacts"
                    })
                } else {
                    console.log(result.rows)
                    response.status(200).send({
                        //memberid: request.decoded.memberid,
                        rowCount: result.rowCount,
                        rows: result.rows
                    })
                }
            }).catch(err => {
                //console.log(err)
                response.status(400).send({
                    message: "SQL Error in contact retrieve",
                    error: err
                })
            })
});

/**
 * @api {post} /contacts/accept Request to accept an incoming request from another user
 * @apiName PostContacts
 * @apiGroup Contacts
 * 
 * @apiDescription Adds the specified user from the user associated with the required JWT. 
 * 
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * 
 * @apiParam {String} memberid the user to add 
 * 
 * @apiSuccess (Success 200) {boolean} success true when the email is updated/inserted
 * 
 * @apiError (400: Unknown user) {String} message "Member ID not found"
 * 
 * @apiError (400: Unknown user) {String} message "Friend ID not found"
 * 
 * @apiError (400: Request does not exists) {String} message "Contact request does not exist"
 * 
 * @apiError (400: Duplicate request) {String} message "Contact's send request was already verified"
 * 
 * @apiError (400: Duplicate request) {String} message "Contact send request already exist"
 * 
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 * 
 */ 
router.post("/accept/:friendId", (request, response, next) => {
    //validate member id exists
    let query = 'SELECT * FROM Members WHERE memberid=$1'
    let values = [request.decoded.memberid]

    pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(400).send({
                    message: "Member ID not found"
                })
            } else {
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error in member validation",
                error: error
            })
        })
    }, (request, response, next) => {
        //validate the friendId exist
        let query = 'SELECT memberid FROM Members WHERE memberid = $1'
        let values = [request.params.friendId]

        pool.query(query, values)
        .then(result => {
            if (result.rowCount == 0) {
                response.status(400).send({
                    message: "Friend ID not found"
                })
            } else {
                //request.params.friendId = result.rows[0].memberid
                next()
            }
        }).catch(error => {
            response.status(400).send({
                message: "SQL Error in contact validation",
                error: error
            })
        })
    },(request, response, next) => {
        //validate if there is no existing contact
        let query = "SELECT * FROM CONTACTS WHERE memberid_a = $1 AND memberid_b = $2"
        let values = [request.decoded.memberid, request.params.friendId]
        pool.query(query, values)
            .then(result => {
                if(result.rowCount == 0) {
                    next()
                } else {
                    response.status(400).send({
                        message: "Contact request already accepted",
                    })
                }

            }).catch(err => {
                response.status(400).send({
                    message: "SQL Error in contact exist validation",
                    error: err
                })
            })

    },(request, response, next) => {
        //UPDATE the existing contact that sent the request
        let query = 'UPDATE Contacts SET verified = 1 WHERE memberid_a = $2 AND memberid_b = $1'
        let values = [request.decoded.memberid, request.params.friendId]
        pool.query(query, values)
            .then(result => {
                if(result.rowCount == 0) {
                    response.status(400).send({
                        message: "Contact's send request was already verified"
                    })
                } else {
                    next()
                }
            }).catch(err => {
                response.status(400).send({
                    message: "SQL Error in contact update",
                    error: err
                })
            })
    }, (request, response) => {
        //Add a contact request
        let query = 'INSERT INTO Contacts (primarykey, memberid_a, memberid_b, verified) VALUES (default, $1, $2, 1)'
        let values = [request.decoded.memberid, request.params.friendId]
        pool.query(query, values)
            .then(result => {
                if(result.rowCount == 0) {
                    response.status(400).send({
                        message: "Contact send request already exist"
                    })
                } else {
                    response.status(200).send({
                        success: true
                    })
                }
            }).catch(err => {
                response.status(400).send({
                    message: "SQL Error in contact accept insert",
                    error: err
                })
            })

})

module.exports = router