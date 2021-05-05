const { confirm_test, reject_test } = require('../config.json');
const dateformat = require('dateformat');
const resultJson = require('../test-result-list.json');
const fs = require('fs');

/*
Save entry in Json, maybe sort the list?
Use a class to keep track of entries and the initialize an array with json objects?
 */

// Keep track of Results
let results = [];
// Save Results persistently with this
let resultList = {
    array: results
};

exports.addTestResult = function (user, message) {
    //ToDo: Maybe find a way to only call this after a restart
    initResultArray();
    const start = new Date();
    const expirationDate = new Date();
    expirationDate.setDate(start.getDate() + 4);
    let roomNumber = 'tmp';
    message.guild.members.fetch(user.id)
        .then(member => {
            roomNumber = member.roles.cache.find(role => role.name.startsWith('W'));
        })
        .catch(error => {
            console.error('Could not fetch guild member!', error);
        });
    //ToDo: Add room number? If yes how to get it? As an argument via !register-test? Via Room Roles on the Discord?
    // ToDo: What if someone on the discord uses !register-test without having a room role
    let entry = {
        name: user.username,
        roomNr: roomNumber,
        emoji: confirm_test,
        expiration: dateformat(expirationDate, 'dd/mm/yy' )
    }
    const duplicate = results.filter(element => element.roomNr === entry.roomNr)
    // If there is already an entry from that person => replace it
    if (duplicate.length !== 0) {
        const pos = results.indexOf(duplicate[0]);
        results[pos] = entry;
        console.log('Replaced existing Entry');
    } else {
        results.push(entry);
    }

    results.push(entry);
    updateResultList();
    const resultsString = JSON.stringify(resultList, null, 4);
    //console.log(resultsString);
    //ToDo: Move the file? If yes how
    fs.writeFile("test-result-list.json", resultsString, (error) => {
        if (error) console.error('Error while saving to json File', error);
    });
}


function initResultArray() {
    results = resultJson.array;
}

function updateResultList() {
    resultList.array = results;
}
