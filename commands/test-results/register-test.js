const Discord = require("discord.js");
const { embeddedInvalidMessage, embeddedSuccessMessage } = require("../../util/embedded-messages");
const { channelID, confirm_test, reject_test } = require('../../config.json');

module.exports = {
    name: 'register-test',
    //ToDo: Extend Description (what will happen with the file, confirm status etc), Set Cooldown to 20, Maybe enable help for it in Dms,
    // Support several attachments or warning to only use one? Only use pdf or images
    description: 'Lets you register your test result via the Bot.\nThe attached file will then be sent for confirmation to @Stockwerksprecher',
    usage: `\`Upload a File/Image first and then add the command as a comment before sending the message\``,
    cooldown: 3,
    execute(message, args) {
        //ToDo: Maybe an option to get next message of author if that is an attachment (if first one failed)
        if (message.channel.type !== 'dm') {
            return message.channel.send(embeddedInvalidMessage('This command can only be executed inside DMs!'));
        }
        if (message.attachments.size === 0) {
            return message.channel.send(embeddedInvalidMessage('Missing Attachment!'));
        }
        if (!message.client.channels.cache.get(channelID)) {
            console.log('Can\'t find destination channel');
            return message.channel.send(embeddedInvalidMessage('There was an error while redirecting your Test Result ' +
                '\nPlease contact Benni#1249'));
        }

        const destinationChannel = message.client.channels.cache.get(channelID);
        const testResult = message.attachments.first();
        let testResult2;
        if (message.attachments.size === 2) {
            testResult2 = message.attachments.last();
            const embedMessages = this.buildEmbeddedTestResults(message, testResult, testResult2);
            this.redirectMessages(message, destinationChannel, embedMessages).then(() => {
                    console.log('Redirected the two Test Result Attachments');
                });
        } else {
            //Redirect test result to specified channel (in this case 1.West Discord)
            destinationChannel.send(this.buildEmbeddedTestResult(message, testResult))
                .then(sent => {
                    let id = sent.id;
                    console.log(`ID of message to react to: ${id}`);

                    sent.react(confirm_test)
                        .then(() => sent.react(reject_test))
                        .catch(() => console.error('Failed to react with one of the emotes'));

                    return message.channel.send(embeddedSuccessMessage('Successfully delivered your test-result!' +
                        '\nSomeone will take a look at it as soon as possible :)'));
                })
                .catch(error => {
                    console.error(`Could not redirect the test-result.\n`, error);
                });
            console.log('Redirected Test Result');
        }




    },

    buildEmbeddedTestResult(message, testResult) {
        console.log(testResult.url);
        const urlParts = testResult.url.split('.');
        console.log();
        //ToDo: Make this better
        if (urlParts[urlParts.length - 1].toLowerCase() === 'pdf') {
            return new Discord.MessageEmbed()
                .setColor('#F1C40F')
                .setTitle(`**Test Result from:** ${message.author.username}`)
                .attachFiles(testResult)
                .addField(
                    'ID', `${message.author.id}`
                )
                .setTimestamp();
        } else {
            return new Discord.MessageEmbed()
                .setColor('#F1C40F')
                .setTitle(`**Test Result from:** ${message.author.username}`)
                .setImage(testResult.url)
                .addField(
                    'ID', `${message.author.id}`
                )
                .setTimestamp();
        }
    },

    buildEmbeddedTestResults(message, testResult, testResult2) {
        console.log('Using two Test Results:');
        console.log(testResult.url);
        console.log(testResult2.url);
        console.log();

        let embedArray = [];
        const urlParts1 = testResult.url.split('.');

        let embed1;
        let embed2;
        // First Result is PDF
        if (urlParts1[urlParts1.length - 1].toLowerCase() === 'pdf') {
            embed1 = new Discord.MessageEmbed()
                .setColor('#F1C40F')
                .setTitle(`**Test Result from:** ${message.author.username} (Part 1)`)
                .attachFiles(testResult)
                .addField(
                    'ID', `${message.author.id}`
                )
                .setTimestamp();
            embed2 = this.resolveSecondMessage(message, testResult2);
        } else {
            // First Result is Image
            embed1 = new Discord.MessageEmbed()
                .setColor('#F1C40F')
                .setTitle(`**Test Result from:** ${message.author.username} (Part 1)`)
                .setImage(testResult.url)
                .addField(
                    'ID', `${message.author.id}`
                )
                .setTimestamp();
            embed2 = this.resolveSecondMessage(message, testResult2);
        }
        embedArray.push(embed1);
        embedArray.push(embed2);
        return embedArray;
    },

    resolveSecondMessage(message, testResult2) {
        const urlParts2 = testResult2.url.split('.');
        if (urlParts2[urlParts2.length - 1].toLowerCase() === 'pdf') {
            return new Discord.MessageEmbed()
                .setColor('#F1C40F')
                .setTitle(`**Test Result from:** ${message.author.username} (Part 2)`)
                .attachFiles(testResult2)
                .addField(
                    'ID', `${message.author.id}`
                )
                .setTimestamp();

        } else {
            return new Discord.MessageEmbed()
                .setColor('#F1C40F')
                .setTitle(`**Test Result from:** ${message.author.username} (Part 2)`)
                .setImage(testResult2.url)
                .addField(
                    'ID', `${message.author.id}`
                )
                .setTimestamp();
        }
    },

    async redirectMessages(message, destinationChannel, embeddedMessages) {
        console.log('Redirecting Two Test Result Attachments')
        await destinationChannel.send(embeddedMessages[0])
            .then(sent => {
                console.log('Redirected First Attachment');
                return message.channel.send(embeddedSuccessMessage('Successfully delivered first Attachment of your test-result!'));
            })
            .catch(error => {
                console.error(`Could not redirect the first Test Result Attachment.\n`, error);
            })

        await destinationChannel.send(embeddedMessages[1])
            .then(sent => {
                let id = sent.id;
                console.log('Redirected Second Attachment')
                console.log(`ID of message to react to: ${id}`);

                sent.react(confirm_test)
                    .then(() => sent.react(reject_test))
                    .catch(() => console.error('Failed to react with one of the emotes'));

                return message.channel.send(embeddedSuccessMessage('Successfully delivered second Attachment of your test-result!' +
                    '\nSomeone will take a look at it as soon as possible :)'));
            })
            .catch(error => {
                console.error(`Could not redirect the second Test Result Attachment.\n`, error);
            });
    }


}
