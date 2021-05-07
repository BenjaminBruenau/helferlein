const config = require('../config.json');
const dateformat = require('dateformat');
const resultJson = require('../test-result-list.json');
const fs = require('fs');
const Discord = require("discord.js");

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

exports.addTestResult = async function (user, message) {
    //ToDo: Maybe find a way to only call this after a restart
    await initResultArray();
    const start = new Date();
    const expirationDate = new Date();
    expirationDate.setDate(start.getDate() + 4);
    let roomNumber = '';
    await message.guild.members.fetch(user.id)
        .then(member => {
            let role = member.roles.cache.find(role => role.name.startsWith('W'));
            roomNumber = role.name;
            console.log(`${roomNumber}`);
        })
        .catch(error => {
            console.error('Could not fetch guild member!', error);
        });
    //ToDo: Add room number? If yes how to get it? As an argument via !register-test? Via Room Roles on the Discord?
    // ToDo: What if someone on the discord uses !register-test without having a room role
    let entry = {
        name: user.username,
        roomNr: roomNumber,
        emoji: config.confirm_test,
        expiration: dateformat(expirationDate, 'dd/mm/yy')
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
    await updateResultList();
    const resultsString = JSON.stringify(resultList, null, 4);
    //console.log(resultsString);
    //ToDo: Move the file? If yes how
    await fs.writeFile("test-result-list.json", resultsString, (error) => {
        if (error) {
            console.error('Error while saving to json File', error);
            return console.log(resultsString);
        }
    });
    updateList(message.client).then(() => {
        console.log('Finished Adding Test Result')
    });
}


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

async function buildList(listMessage) {
    let list = '**Name**'.padEnd(12, '\u3000') + '**Room**'.padEnd(5, '\u3000') + '\u3000\u3000\u3000**Expiring**\n';
    const split = '+---------------+------+-----+-----------+\n';

    results.forEach(entry => {
        list += split + `${entry.name}`.padEnd(14 - entry.name.length,'\u3000') + `${entry.roomNr} `
            + `\u3000${entry.emoji}\u3000${entry.expiration}\n`;
    });
    const embedTable = new Discord.MessageEmbed()
        .setTitle('__**Test Results**__')
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
    await channel.messages.fetch({limit:99})
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

function initResultArray() {
    results = resultJson.array;
}

function updateResultList() {
    resultList.array = results;
}
