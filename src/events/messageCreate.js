import { Events } from 'discord.js';

export default {
    name: Events.MessageCreate,
    async execute(message) {
        // Let the message tracker handle this
        const messageTracker = message.client.messageTracker;
        if (messageTracker) {
            await messageTracker.handleMessage(message);
        }
    }
};
