module.exports = {
    name: 'ping',
    description: 'Ping!',
    disabled: 'true',
    execute(message, args) {
        message.channel.send('Pong!');
    },
}
