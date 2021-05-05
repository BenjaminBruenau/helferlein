const fs = require('fs');
const Discord = require('discord.js');
const {addTestResult} = require("./test-result-list/test-result-list");
const {sleep} = require("./util/sleep");
const { embeddedInvalidMessage, embeddedSuccessMessage } = require("./util/embedded-messages");
const { prefix, token, confirm_test, reject_test, channelID } = require('./config.json');

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


client.on('messageReactionAdd', (reaction, user) => {
    const isCorrectEmoji = reaction.emoji.name === confirm_test || reaction.emoji.name === reject_test;
    const isCorrectChannel = reaction.message.channel.id === channelID;
    //console.log(reaction.message.channel.id);

    if (!isCorrectChannel || !isCorrectEmoji || reaction.count === 1) {
        return;
    }
    handleTestResultReactions(reaction, user)
        .then(result => console.log(result));

})

client.on('raw', packet => {
    if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE'].includes(packet.t)) return;

    const channel = client.channels.cache.get(channelID);

    //Message is cached
    if (channel.messages.cache.has(packet.d.message_id)) return;

    //Fetch Message since its not cached
    channel.messages.fetch(packet.d.message_id).then(message => {
        // Emojis can have identifiers of name:id format
        const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
        const reaction = message.reactions.cache.get(emoji);

        // Check which type of event it is before emitting
        if (packet.t === 'MESSAGE_REACTION_ADD') {
            client.users.fetch(packet.d.user_id)
                .then(user => {
                    client.emit('messageReactionAdd', reaction, user);
                })
                .catch(() => console.error('Failed to retrieve User'));
        }
        if (packet.t === 'MESSAGE_REACTION_REMOVE') {
            client.users.fetch(packet.d.user_id)
                .then(user => {
                    client.emit('messageReactionRemove', reaction, user);
                })
                .catch(() => console.error('Failed to retrieve User'));
        }
    });
})


async function handleTestResultReactions(reaction, user) {
    const message = reaction.message;
    const testResult = message.embeds[0];

    if (message.embeds.length < 0) {
        return console.log('Somehow this is not an embedded Message :(');
    }
    if (testResult.fields.length < 0) {
        return console.log('There an no Fields in this embedded Message (ID is therefore missing)')
    }
    const userID = testResult.fields[0].value;

    //Check if Reaction Count changed (Reaction was taken back)
    const before = reaction.count;
    // Wait 5 seconds


    // Remove reaction if there were already more than 2 reactions (bot + 1 User) to avoid problems e.g. send Confirmation twice
    if ((before - 1) !== 1) {
        reaction.users.remove(user)
            .then(removedReaction => console.log(`Removed ${removedReaction.emoji} from ${user.username} since the number`
             + ` of reactions was exceeding the limit`))
            .catch(error => {
                console.error('Could not remove reaction\n', error);
            });
        return 'Canceled Reacting';
    }

    await sleep(5000);
    const after = reaction.count;

    //Reaction was taken back
    if (after < before) {
        user.send(embeddedSuccessMessage(`Successfully canceled Confirmation!`))
            .then(msg => {
                if (msg.channel.type === 'dm') return;
                console.log('Notified Test Result Confirmation Executor and did not send Confirmation to User');
            })
            .catch(error => {
                console.error(`Could not send help DM to ${message.author.tag}.\n`, error);
            });
        return 'Canceled Confirmation/Rejection';
    }
    //Accept Test Result and notify user
    if (reaction.emoji.name === confirm_test) {
        //ToDo: Add List and List handling
        client.users.fetch(userID)
            .then(userTest => {
                userTest.send(embeddedSuccessMessage('Your Test Result has been confirmed! :)'))
                    .then(msg => {
                        addTestResult(userTest, message);
                        if (msg.channel.type === 'dm'){
                            user.send(embeddedSuccessMessage(`${userTest.username} has been notified of the Confirmation`))
                            return console.log('Notified User of Test Result Confirmation');
                        }
                    })
                    .catch(error => {
                        console.error(`Could not send DM to ${message.author.tag}.\n`, error);
                    });
            })
            .catch(() => console.error('Error while trying to get user'));
        return 'Confirmed Test Result';
    }

    let embedTable = new Discord.MessageEmbed()
        .setDescription(getTable())
    await message.channel.send(embedTable)
    return 'Huh, nothing happened';
}


function getTable() {
    let s =
   "+--------+--------------+\n" +
   "| Hearts | Extra Damage |\n" +
   "+--------+--------------+\n"+
   "| 7      | 0,1          |\n"+
   "+--------+--------------+\n"+
   "| 6,5    | 0,15         |\n"+
   "+--------+--------------+\n"+
   "| 6      | 0,2          |\n"+
   "+--------+--------------+\n"+
   "| 5,5    | 0,25         |\n"+
   "+--------+--------------+\n"+
   "| 5      | 0,3          |\n"+
   "+--------+--------------+\n"+
   "| 4,5    | 0,35         |\n"+
   "+--------+--------------+\n"+
   "| 4      | 0,4          |\n"+
   "+--------+--------------+\n"+
   "| 3,5    | 0,45         |\n"+
   "+--------+--------------+\n"+
   "| 3      | 0,5          |\n"+
   "+--------+--------------+\n"+
   "| 2,5    | 0,55         |\n"+
   "+--------+--------------+\n"+
   "| 2      | 0,6          |\n"+
   "+--------+--------------+\n"+
   "| 1,5    | 0,6          |\n"+
   "+--------+--------------+\n"+
   "| 1      | 0,6          |\n"+
   "+--------+--------------+\n"+
   "| 0,5    | 0,8          |\n"+
   "+--------+--------------+\n";
    return s;
}

