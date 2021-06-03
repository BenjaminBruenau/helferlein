const { updateTestResultRoom } = require("../../test-result-list/test-result-list");
const { embeddedInvalidMessage, embeddedSuccessMessage } = require("../../util/embedded-messages");

module.exports = {
    name: 'update-room',
    description: `Updates the room of the specified person with the specified room (e.g. W121)`,
    usage: '<username> <room>',
    permissions: 'ADMINISTRATOR',
    cooldown: 3,
    show: false,
    async execute(message, args) {
        const username = args[0];
        const newRoom = args[1];
        if (!args.length) {
            return message.channel.send(embeddedInvalidMessage(`Usage: !update-room ${this.usage}`));
        }
        if (message.channel.type === 'dm') {
            return message.channel.send(embeddedInvalidMessage('You can not execute this Command inside DMs'));
        }
        if (!args[1].startsWith('W') || args[1].length !== 4) {
            return message.channel.send(embeddedInvalidMessage(`**Invalid Room!**\n
            The Room has to be specified like this: \`WXXX\`\n
            e.g. W121`));
        }

        const returnMessage = await updateTestResultRoom(username, newRoom, message);
        if (returnMessage.startsWith('T')) {
            console.log('User to update Test Result of not found');
            return message.channel.send(embeddedInvalidMessage(returnMessage));
        } else {
            console.log(`Updated Test Result Room of ${username}:`);
            console.log(`Room was changed to ${newRoom}`);
            return message.channel.send(embeddedSuccessMessage(returnMessage));
        }

    }
}
