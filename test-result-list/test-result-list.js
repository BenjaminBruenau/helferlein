const { confirm_test, reject_test } = require('../config.json');

/*
Save entry in Json, maybe sort the list?
Use a class to keep track of entries and the initialize an array with json objects?
 */

exports.addTestResult = function (user) {
    const start = new Date();
    const expirationDate = new Date();
    expirationDate.setDate(start.getDate() + 4);
    //ToDo: Add room number? If yes how to get it? As an argument via !register-test? Via Room Roles on the Discord?
    let entry = {
        name: user.username,
        emoji: confirm_test,
        expiration: expirationDate.format('dd-m-yy')
    }
}
