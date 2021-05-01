const fs = require('fs');
const Discord = require('discord.js');
const { embeddedInvalidMessage } = require("./commands/util/embedded-messages");
const { prefix, token} = require('./config.json');

const client = new Discord.Client();

client.cooldowns = new Discord.Collection();

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
    //ToDo: This is pretty messy
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    /*
    if (message.content === `${prefix}server`) {
        message.channel.send(`This server's name is: ${message.guild.name} \nMembers: ${message.guild.memberCount}`);
     */
    if (!client.commands.has(commandName)) return;

    //Get command and check for possible aliases
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (command.disabled) {
        return console.log(`${prefix}${commandName} is disabled!`);
    }

    //Check for sufficient permissions
    if (command.permissions) {
        if (message.channel.type === 'dm') {
            return message.reply(embeddedInvalidMessage('I can\'t execute this command inside DMs!'));
        }
        const authorPerms = message.channel.permissionsFor(message.author);
        if (!authorPerms || !authorPerms.has(command.permissions)) {
            return message.reply(embeddedInvalidMessage('Insufficient Permissions!'));
        }
        console.log(`Sufficient Permissions to execute ${prefix}${commandName}`);
    }

    //Check for correct Usage
    if (command.args && !args.length) {
        let reply = `You did not provide any arguments, ${message.author.username}!`;

        if (command.usage) {
            reply += `\nThe correct usage is: \`${prefix}${commandName} ${command.usage}\``;
        }
        return message.channel.send(embeddedInvalidMessage(reply, '#e37b00'));
    }

    //Check for cooldown
    const { cooldowns } = client;
    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }
    const now =  Date.now();
    const timestamps =  cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(embeddedInvalidMessage(`Please wait ${timeLeft.toFixed(1)} more second(s) before reusing this command`, '#e37b00'));
        }
    }
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    //Execute Command
    try {
        command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply(embeddedInvalidMessage('There was an error trying to execute this command!'));
    }
});

