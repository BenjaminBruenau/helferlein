const {embeddedInvalidMessage} = require("../util/embedded-messages");

module.exports = {
    name: 'register-test',
    //ToDo: Extend Description (what will happen with the file, confirm status etc), Set Cooldown to 20, Maybe enable help for it in Dms,
    // Support several attachments or warning to only use one?
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
        message.client.channels.cache.get('838158644889649203').send(message.attachments.first());
        console.log('OK');
    },
}
