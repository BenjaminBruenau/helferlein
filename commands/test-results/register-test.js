const Discord = require("discord.js");
const { embeddedInvalidMessage, embeddedSuccessMessage} = require("../../util/embedded-messages");

module.exports = {
    name: 'register-test',
    //ToDo: Extend Description (what will happen with the file, confirm status etc), Set Cooldown to 20, Maybe enable help for it in Dms,
    // Support several attachments or warning to only use one? Only use pdf or images
    description: 'Lets you register your test result via the Bot.\nThe attached file will then be sent for confirmation to @Stockwerkssprecher',
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
        if (!message.client.channels.cache.get('838158644889649203')) {
            console.log('Can\'t find destination channel');
            return message.channel.send(embeddedInvalidMessage('There was an error while redirecting your Test Result \nPlease contact Benni#1249'));
        }
        const destinationChannel = message.client.channels.cache.get('838158644889649203');
        const testResult = message.attachments.first();
        destinationChannel.send(buildEmbeddedTestResult())
            .then(sent => {
                let id = sent.id;
                console.log(`ID of message to react to: ${id}`);
                sent.react('✅').then(() => sent.react('❌'));
                return message.channel.send(embeddedSuccessMessage('Successfully delivered your test-result!\nSomeone will take a look at it as soon as possible :)'));
            })
            .catch(error => {
                console.error(`Could not react to test-result message.\n`, error);
            });
        //message.react('😄');
        //destinationChannel.messages.cache.last().react('😄');
        console.log('OK');

        function buildEmbeddedTestResult() {
            console.log(testResult.url);
            const urlParts = testResult.url.split('.');
            console.log();
            //ToDo: Make this better
            if (urlParts[urlParts.length - 1] === 'pdf') {
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

        }
    },
}
