const { prefix } = require('../../config.json');
const Discord = require('discord.js');
const iconUrl = 'https://i.imgur.com/h1hUnKw.jpeg';

module.exports = {
    name: 'help',
    description: 'List all commands or information about a specific command',
    aliases: ['commands'],
    usage: '<command name>',
    permissions: 'READ_CHANNEL',
    cooldown: 5,
    show: false,
    execute(message, args) {
        const { commands } = message.client;

        //no command specified
        if (!args.length) {
            return embeddedHelp();
        }
        //command specified
        embeddedCommandHelp();


        function embeddedHelp() {
            const embeddedHelp = new Discord.MessageEmbed()
                .setColor('#F1C40F')
                .setTitle('**Help from Helferlein**')
                .setDescription(`You can see all of my commands here. \nTo see information of a specific command please use: \n \`${prefix}help [command name]\``)
                .setThumbnail(iconUrl)
                .addFields(
                    { name: 'Commands', value: getCommands() },
                    { name: '\u200B', value: '\u200B' },
                )
                .setTimestamp()
                .setFooter('Helferlein', iconUrl);
            message.channel.send(embeddedHelp);
        }

        function embeddedCommandHelp() {
            const name = args[0].toLowerCase();
            const command = commands.get(name) || commands.find(c => c.aliases && c.aliases.includes(name));

            if (!command) {
                const embeddedInvalidCommand = new Discord.MessageEmbed()
                    .setColor('#ff0000')
                    .setTitle(`\`${name}\` is not a valid command!`);
                return message.channel.send(embeddedInvalidCommand);
            }

            const embeddedCmdHelp = new Discord.MessageEmbed()
                .setColor('#F1C40F')
                .setTitle(`**Name:** \`${prefix}${command.name}\``)
                .setDescription(buildCommandDescription(command))
                .setThumbnail(iconUrl)
                .setTimestamp()
                .setFooter('Helferlein', iconUrl);
            message.channel.send(embeddedCmdHelp);
        }

        function getCommands() {
            let names = [];
            const cmds = commands.filter(cmd => cmd.show !== false);
            names.push(cmds.map(
                command => `\`${prefix}${command.name}\``).join('\n'));
            return names;
        }

        function buildCommandDescription(command) {
            let description = [];
            if (command.aliases) description.push(`**Aliases:** ${command.aliases.join(', ')}`);
            if (command.description) description.push(`**Description:** ${command.description}`);
            if (command.usage) description.push(`**Usage:** ${prefix}${command.name} ${command.usage}`);

            description.push(`**Cooldown:** ${command.cooldown || 3} second(s)`);
            return description;
        }

    },
}
