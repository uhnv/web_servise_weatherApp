
/**
 * Checks the parameter to see if it is a a String with a length greater than 0.
 * 
 * @param {string} param the value to check
 * @returns true if the parameter is a String with a length greater than 0, false otherwise
 */
let isStringProvided = (param) => 
    param !== undefined && param.length > 0


// Feel free to add your own validations functions!
// for example: isNumericProvided, isValidPassword, isValidEmail, etc
// don't forget to export any 

/**
 * Checks the parameter to see if it is a String with a length greater than 5 ('@', '.', 'com'). com/net/org are all 3 letters
 * Also checks if String includes '@' and '.', and contains no white spaces
 * 
 * @param {string} param the value to check
 * @returns true if the parameter is a String with a length greater than 5, includes '@' and '.', and exclude spaces, false otherwise
 */
let isValidEmail = (param) =>
    param.includes('@') && 
    param.includes('.') && 
    !param.includes(' ') && 
    param.length > 5
  
module.exports = { 
  isStringProvided, isValidEmail
}