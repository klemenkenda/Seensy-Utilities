/**
 * Modify string to alpha numeric
 *
 * @param myName  {String}  input
 * @return        {String}  alpha-numeric representation of input   
 */
exports.nameFriendly = function (myName) {
    return myName.replace(/\W/g, '');
}
