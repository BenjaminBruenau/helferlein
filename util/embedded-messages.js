const Discord = require('discord.js');

/**
 *
 * @param error A string with an error message
 * @param color Color of the embedded message, red by default
 * @returns An embedded Error Message
 */
exports.embeddedInvalidMessage = function (error, color= '#ff0000') {
    //ToDo: Possibly extend this to provide more flexibility and better custom Error Messages
    return new Discord.MessageEmbed()
        .setColor(color)
        .setTitle(error);
}

exports.embeddedSuccessMessage = function (success) {
    return new Discord.MessageEmbed()
        .setColor('#53ae12')
        .setTitle(success);
}

