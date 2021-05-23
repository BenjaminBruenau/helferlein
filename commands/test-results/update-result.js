const {updateTestResult} = require("../../test-result-list/test-result-list");
const { embeddedInvalidMessage, embeddedSuccessMessage } = require("../../util/embedded-messages");

module.exports = {
    name: 'update-result',
    description: `Updates the test result of the specified person with the specified Date (Dateformat: \`dd/mm/yy\`)`,
    usage: '<username> <date of test-result>',
    permissions: 'KICK_MEMBERS',
    cooldown: 3,
    show: false,
    async execute(message, args) {
        const username = args[0];
        const newDate = args[1];
        if (!args.length) {
            return message.channel.send(embeddedInvalidMessage(`Usage: !update-result ${this.usage}`));
        }
        if (message.channel.type === 'dm') {
            return message.channel.send(embeddedInvalidMessage('You can not execute this Command inside DMs'));
        }
        if (args[1].split('/').length !== 3) {
            return message.channel.send(embeddedInvalidMessage(`**Invalid Date!**\n
            The Date has to be specified like this: \`dd/mm/yy\`\n
            e.g. 19/05/21`));
        }

        const returnMessage = await updateTestResult(username, newDate, message);
        if (returnMessage.startsWith('T')) {
            console.log('User to update Test Result of not found');
            return message.channel.send(embeddedInvalidMessage(returnMessage));
        } else {
            console.log(`Updated Test Result of ${username}:`);
            console.log(`Date was changed to ${newDate}`);
            return message.channel.send(embeddedSuccessMessage(returnMessage));
        }

    }
}
