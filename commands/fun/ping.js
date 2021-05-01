module.exports = {
    name: 'ping',
    description: 'Ping!',
    disabled: false,
    cooldown: 5,
    execute(message, args) {
        message.channel.send('Pong!');
    },
}
