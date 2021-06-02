const config = require('../config.json');
const dateformat = require('dateformat');
const resultJson = require('../test-result-list.json');
const fs = require('fs');
const Discord = require("discord.js");

// Keep track of Results
let results = [];
// Save Results persistently with this (MongoDB auf Wish bestellt)
let resultList = {
    array: results
};

exports.addTestResult = async function (user, message) {
    //ToDo: Maybe find a way to only call this after a restart
    initResultArray();
    const start = new Date();
    const expirationDate = new Date();
    expirationDate.setDate(start.getDate() + 4);
    let roomNumber = '';
    await message.guild.members.fetch(user.id)
        .then(member => {
            console.log(`Fetched Guild Member ${member.displayName}`);
            //ToDO: Fix Error (Could not fetch guild member! TypeError: Cannot read property 'name' of undefined
            // role isn't found even though it is there
            // 0|index  | 2021-05-12T18:13:15:     at /root/helferlein/test-result-list/test-result-list.js:29:31
            // 0|index  | 2021-05-12T18:13:15:     at processTicksAndRejections (internal/process/task_queues.js:93:5)
            // 0|index  | 2021-05-12T18:13:15:     at async exports.addTestResult (/root/helferlein/test-result-list/test-result-list.js:26:5))
            let role = member.roles.cache.find(memberRole => memberRole.name.startsWith('W'));
            roomNumber = role.name;
            console.log(`${roomNumber}`);
        })
        .catch(error => {
            console.error('Could not fetch guild member!', error);
        });
    // ToDo: What if someone on the discord uses !register-test without having a room role
    let entry = {
        name: user.username,
        roomNr: roomNumber,
        emoji: config.confirm_test,
        expiration: dateformat(expirationDate, 'dd/mm/yy'),
        id: user.id
    }
    const duplicate = results.filter(element => element.id === entry.id)

    // If there is already an entry from that person => replace it
    if (duplicate.length !== 0) {
        const pos = results.indexOf(duplicate[0]);
        results[pos] = entry;
        console.log('Replaced existing Entry');
    } else {
        results.push(entry);
    }

    await updateJson();
    updateList(message.client).then(() => {
        console.log('Finished Adding Test Result')
    });
}

exports.rejectTestResult = async function (user, message) {
    initResultArray();
    const findEntry = results.filter(entry => entry.id === user.id);
    if (findEntry.length === 0) {
        return console.log('Could not find any List Entries for that user');
    }
    const pos = results.indexOf(findEntry[0]);
    results[pos].emoji = config.reject_test;
    results[pos].expiration = '\u3000/ '

    await updateJson();
    updateList(message.client).then(() => {
        console.log('Finished Rejecting Test Result')
    });
}

exports.updateTestResultDate = async function (username, newDate, message) {
    initResultArray();
    const entry = getEntry(username);
    if (!entry) {
        return 'The specified user does not exist';
    }
    const pos = getPositionOfEntry(entry);

    const newExpirationDate = parseDate(newDate);
    newExpirationDate.setDate(newExpirationDate.getDate() + 4);

    results[pos].expiration = dateformat(newExpirationDate, 'dd/mm/yy');

    await updateTestResults(message, 'Finished Updating Test Result Date');
    return 'Successfully updated Test Result Date';
}

exports.updateTestResultRoom = async function (username, roomNumber, message) {
    initResultArray();
    const entry = getEntry(username);
    if (!entry) {
        return 'The specified user does not exist';
    }
    const pos = getPositionOfEntry(entry);

    results[pos].roomNr = roomNumber;
    await updateTestResults(message, 'Finished Updating Test Result Room');
    return 'Successfully updated Test Result Room';
}

async function updateTestResults(message, logMessage) {
    await updateJson();
    updateList(message.client).then(() => {
        console.log(logMessage);
    })
}

function getEntry(username) {
    const findEntry = results.filter(entry => entry.name === username);
    if (findEntry.length === 0) {
        console.log('The specified user does not exist');
        return undefined;
    }
    return findEntry[0];
}

function getPositionOfEntry(entry) {
    return results.indexOf(entry);
}

/**
 * Has to be called after changing the result list in any way.
 * Will also verify the expiration Dates and sort the list accordingly.
 */
async function updateJson() {
    verifyDates();
    sortResultArray();
    updateResultList();
    const resultsString = JSON.stringify(resultList, null, 4);
    //console.log(resultsString);
    //ToDo: Move the file? If yes how
    await fs.writeFile("test-result-list.json", resultsString, (error) => {
        if (error) {
            console.error('Error while saving to json File', error);
            return console.log(resultsString);
        }
    });
}

/**
 *  Will update the Result List in the specific Channel.
 */
async function updateList(client) {
    const listChannel = client.channels.cache.get(config.channelID_List);
    let listMessage = listChannel.messages.cache.get(config.listMessage_ID);
    //ToDo: Global Methods for fetching things and respective error messages
    if (!listMessage) {
        await deleteAllMessages(listChannel);
        const initEmbed = new Discord.MessageEmbed().setDescription('Initiating List');
        await listChannel.send(initEmbed)
            .then(table => {

                listMessage = table;
                console.log(table.id);
                console.log('Send init Message')
            }).catch(error => {
                console.error('Error while sending new Test-Result List', error);
            });
        // Save new ID to config
        config.listMessage_ID = listMessage.id;
        const configString = JSON.stringify(config, null, 2);
        //ToDo: Something doesnt work here
        await fs.writeFile('../config.json', configString, (error) => {
            if (error) {
                console.error('Error while saving to json File', error);
                return console.log(configString);
            }
            //console.log(configString);
            console.log('Saved Config');
        });
    }

    await buildList(listMessage)
    //ToDo: Build List String (Ascii Art, maybe html/css)
    console.log('Updated Test-Result List');
}

/**
 * Builds List according to the result array/the underlying JSON Structure
 */
async function buildList(listMessage) {
    //ToDo: replace ascii art with HTML and CSS
    let list = '**Name**'.padEnd(12, '\u3000') + '**Room**'.padEnd(5, '\u3000') + '\u3000\u3000\u3000**Expiring**\n';
    const split = '+---------------+------+-----+-----------+\n';

    results.forEach(entry => {
        let name = entry.name;
        if ((14 - entry.name.length) <= 0) {
            const nameParts = entry.name.split(' ');
            name = nameParts[0];
        }
        list += split + `${name}`.padEnd(23 - name.length,'\u2004') + `${entry.roomNr} `
            + `\u2004${entry.emoji}\u2004${entry.expiration}\n`;
    });
    const embedTable = new Discord.MessageEmbed()
        .setTitle('__**Test Results**__')
        .setColor('#F1C40F')
        .setDescription(list)
        .setFooter('|' + '\u3000'.repeat(20) +  '|');
    await listMessage.edit(embedTable)
        .then(result => {
            console.log('Successfully Edited List');
        })
        .catch(error => {
            console.error('Error while editing List', error);
        });

}

async function deleteAllMessages(channel) {
    // Can only delete last 100
    await channel.messages.fetch({limit: 99})
        .then(messages => {
            channel.bulkDelete(messages)
                .then(() => {
                    console.log('Deleted all Messages in Channel');
                })
                .catch(error => {
                    console.error('Error while trying to delete all Messages', error);
                })
        })
        .catch(error => {
            console.error('Error while fetching last 99 Messages', error);
        });
}

function verifyDates() {
    const today = new Date();
    results.forEach(entry => {

        let expirationDate = parseDate(entry.expiration);
        if (expirationDate <= today) {
            entry.emoji = '🚫';
            console.log(`${entry.name}'s Test Result has expired!`);
        }
        if (entry.emoji === '🚫' && expirationDate > today) {
            entry.emoji = config.confirm_test;
        }
    });
}

function parseDate(dateString) {
    const dateParts = dateString.split('/');
    const year = parseInt(`20${dateParts[2]}`);
    const month = parseInt(dateParts[1]);
    const day = parseInt(dateParts[0]);
    //ToDo: This produces a lot of Logs, maybe change this to log.debug or smth similar?
    //console.log(`Parsed Date: ${day}-${month}-${year}`);

    return new Date(year, month - 1, day);
}

function sortResultArray() {
    results.sort((a, b) => parseDate(b.expiration) - parseDate(a.expiration));
    console.log('Sorted Test Result List!');
}

function initResultArray() {
    results = resultJson.array;
}

function updateResultList() {
    resultList.array = results;
}
