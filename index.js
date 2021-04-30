const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token} = require('./config.json');

const client = new Discord.Client();

client.commands = new Discord.Collection();
const commandFolders = fs.readdirSync('./commands');

for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`./commands/${folder}/${file}`);
        client.commands.set(command.name, command);
    }
}

client.once('ready', () => {
    console.log('Ready!');
});

client.login(token).then(value => console.log('Successfully Logged in!'));

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    /*
    if (message.content === `${prefix}server`) {
        message.channel.send(`This server's name is: ${message.guild.name} \nMembers: ${message.guild.memberCount}`);
     */
    if (!client.commands.has(commandName)) return;

    const command = client.commands.get(commandName);
    if (command.disabled) {
        return console.log(`${prefix}${commandName} is disabled!`);
    }

    if (command.args && !args.length) {
        let reply = `You did not provide any arguments, ${message.author}!`;

        if (command.usage) {
            reply += `\nThe correct usage is: \`${prefix}${commandName} ${command.usage}\``;
        }
        return message.channel.send(reply);
    }

    try {
        command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('There was an error trying to execute this command!');
    }
});

