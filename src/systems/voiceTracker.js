import Staff from '../database/Staff.js';

/**
 * Voice Activity Tracking System
 * Tracks when staff members join/leave voice channels and awards points
 */
export class VoiceTracker {
    constructor(client) {
        this.client = client;
    }

    /**
     * Handle voice state updates
     */
    async handleVoiceStateUpdate(oldState, newState) {
        try {
            const member = newState.member;

            // Check if user is staff
            if (!member.roles.cache.has(process.env.STAFF_ROLE_ID)) {
                return;
            }

            const staff = await Staff.getOrCreate(member.id);

            // User joined a voice channel
            if (!oldState.channel && newState.channel) {
                await this.handleVoiceJoin(staff, member);
            }

            // User left a voice channel
            if (oldState.channel && !newState.channel) {
                await this.handleVoiceLeave(staff, member);
            }

            // User switched channels
            if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
                await this.handleVoiceLeave(staff, member);
                await this.handleVoiceJoin(staff, member);
            }
        } catch (error) {
            console.error('Error in voice state update:', error);
        }
    }

    /**
     * Handle voice channel join
     */
    async handleVoiceJoin(staff, member) {
        staff.voiceJoinTimestamp = Date.now();
        await staff.save();
        console.log(`✅ ${member.user.tag} joined voice channel`);
    }

    /**
     * Handle voice channel leave
     */
    async handleVoiceLeave(staff, member) {
        if (!staff.voiceJoinTimestamp) {
            return;
        }

        const duration = Date.now() - staff.voiceJoinTimestamp;
        const minutes = Math.floor(duration / (1000 * 60));
        const hours = duration / (1000 * 60 * 60);

        // Award points based on hours
        const pointsPerHour = parseInt(process.env.POINTS_PER_HOUR_VOICE) || 10;
        const pointsEarned = Math.floor(hours * pointsPerHour);

        if (pointsEarned > 0) {
            staff.voiceMinutes += minutes;
            await staff.addPoints('voice', pointsEarned);
            console.log(`✅ ${member.user.tag} earned ${pointsEarned} voice points (${minutes} minutes)`);
        }

        staff.voiceJoinTimestamp = null;
        await staff.save();
    }

    /**
     * Get weekly voice activity summary
     */
    async getWeeklySummary() {
        try {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

            const staffMembers = await Staff.find({
                voiceMinutes: { $gt: 0 }
            }).sort({ voiceMinutes: -1 }).limit(10);

            return staffMembers;
        } catch (error) {
            console.error('Error getting weekly summary:', error);
            return [];
        }
    }
}
