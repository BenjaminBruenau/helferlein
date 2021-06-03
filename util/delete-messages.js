/**
 * Will delete the maximum possible Messages in the specified channel.
 * Due to a limitation from Discord the limit is 100.
 * @param channel The Channel to delete Messages in
 */
exports.deleteAllMessages = async function (channel) {
    // Can only delete last 100
    await channel.messages.fetch({limit: 99})
        .then(messages => {
            channel.bulkDelete(messages)
                .then(() => {
                    console.log('Deleted all Messages in Channel');
                })
                .catch(error => {
                    console.error('Error while trying to delete all Messages', error);
                })
        })
        .catch(error => {
            console.error('Error while fetching last 99 Messages', error);
        });
}


