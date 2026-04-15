import Staff from '../database/Staff.js';

/**
 * Message & Word Tracking System
 * Tracks messages and words sent by staff members and awards points
 */
export class MessageTracker {
    constructor(client) {
        this.client = client;
    }

    /**
     * Handle message creation
     */
    async handleMessage(message) {
        try {
            // Ignore bot messages
            if (message.author.bot) return;

            // Check if user is staff
            if (!message.member?.roles.cache.has(process.env.STAFF_ROLE_ID)) {
                return;
            }

            const staff = await Staff.getOrCreate(message.author.id);

            // Count message
            staff.messageCount += 1;

            // Count words
            const words = message.content.trim().split(/\s+/).filter(word => word.length > 0);
            const wordCount = words.length;
            staff.wordCount += wordCount;

            // Award points for message
            const pointsPerMessage = parseInt(process.env.POINTS_PER_MESSAGE) || 1;
            let pointsEarned = pointsPerMessage;

            // Award points for words (every 10 words)
            const pointsPer10Words = parseInt(process.env.POINTS_PER_10_WORDS) || 2;
            const wordPointsMultiplier = Math.floor(wordCount / 10);
            pointsEarned += wordPointsMultiplier * pointsPer10Words;

            // Add points
            if (pointsEarned > 0) {
                await staff.addPoints('message', pointsEarned);
            }

            await staff.save();

        } catch (error) {
            console.error('Error in message tracking:', error);
        }
    }

    /**
     * Get top message senders
     */
    async getTopMessageSenders(limit = 10) {
        try {
            const staffMembers = await Staff.find({
                messageCount: { $gt: 0 }
            }).sort({ messageCount: -1 }).limit(limit);

            return staffMembers;
        } catch (error) {
            console.error('Error getting top message senders:', error);
            return [];
        }
    }
}
