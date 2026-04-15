import { Events } from 'discord.js';

export default {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        // Let the voice tracker handle this
        const voiceTracker = newState.client.voiceTracker;
        if (voiceTracker) {
            await voiceTracker.handleVoiceStateUpdate(oldState, newState);
        }
    }
};
