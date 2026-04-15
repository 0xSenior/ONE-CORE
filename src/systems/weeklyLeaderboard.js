import { generateLeaderboard } from '../utils/leaderboardImage.js';
import { createInfoEmbed } from '../utils/embeds.js';
import Staff from '../database/Staff.js';

export class WeeklyLeaderboard {
    constructor(client) {
        this.client = client;
        this.intervalId = null;
        this.LEADERBOARD_CHANNEL_ID = process.env.LEADERBOARD_CHANNEL_ID;
    }

    /**
     * Start the weekly leaderboard scheduler
     */
    start() {
        console.log('📅 Weekly Leaderboard scheduler started');
        
        // Check every minute if it's time to post
        this.intervalId = setInterval(() => {
            this.checkAndPost();
        }, 60 * 1000); // Check every minute
        
        // Also check immediately on start
        this.checkAndPost();
    }

    /**
     * Stop the scheduler
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('📅 Weekly Leaderboard scheduler stopped');
        }
    }

    /**
     * Check if it's time to post the leaderboard (Friday 9 PM)
     */
    checkAndPost() {
        const now = new Date();
        const day = now.getDay(); // 0 = Sunday, 5 = Friday
        const hour = now.getHours();
        const minute = now.getMinutes();

        // Check if it's Friday (5) at 21:00 (9 PM)
        if (day === 5 && hour === 21 && minute === 0) {
            console.log('📅 It\'s Friday 9 PM - Posting weekly leaderboard...');
            this.postLeaderboard();
        }
    }

    /**
     * Post the leaderboard and reset points
     */
    async postLeaderboard() {
        try {
            // Get the leaderboard channel
            const channel = this.client.channels.cache.get(this.LEADERBOARD_CHANNEL_ID);
            if (!channel) {
                console.error('❌ Leaderboard channel not found!');
                return;
            }

            // Get top 10 staff members
            const topStaff = await Staff.find({}).sort({ totalPoints: -1 }).limit(10);

            if (topStaff.length === 0) {
                await channel.send({
                    embeds: [createInfoEmbed('📊 التوب الأسبوعي', 'لا يوجد أعضاء في قاعدة البيانات حتى الآن')]
                });
                return;
            }

            // Prepare users data
            const preparedUsers = (await Promise.all(topStaff.map(async (staff) => {
                const member = await channel.guild.members.fetch(staff.userId).catch(() => null);
                if (!member || !member.roles.cache.has(process.env.STAFF_ROLE_ID)) return null;

                return {
                    username: member.displayName,
                    avatarURL: member.user.displayAvatarURL({ extension: 'png', size: 128 }),
                    totalPoints: staff.totalPoints,
                    adminPoints: staff.adminPoints,
                    voicePoints: staff.voicePoints,
                    messagePoints: staff.messagePoints
                };
            }))).filter(user => user !== null);

            if (preparedUsers.length === 0) {
                await channel.send({
                    embeds: [createInfoEmbed('📊 التوب الأسبوعي', 'لا يوجد أعضاء إدارة مع نقاط حتى الآن')]
                });
                return;
            }

            // Generate leaderboard image
            const attachment = await generateLeaderboard(preparedUsers);

            // Send the leaderboard image first
            const message = await channel.send({
                files: [attachment]
            });

            console.log('✅ Weekly leaderboard posted successfully');

            // Calculate dates for the reply message
            const today = new Date();
            const lastWeek = new Date(today);
            lastWeek.setDate(lastWeek.getDate() - 7);
            
            const formatDate = (date) => {
                return date.toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            };

            // Send reply with date information
            await message.reply({
                content: `📊 **التوب الأسبوعي**\n\n📅 بتاريخ: ${formatDate(today)}\n⏳ من: ${formatDate(lastWeek)} إلى: ${formatDate(today)}`
            });

            // Reset all points after posting
            await this.resetAllPoints();
            
        } catch (error) {
            console.error('❌ Error posting weekly leaderboard:', error);
        }
    }

    /**
     * Reset all staff points
     */
    async resetAllPoints() {
        try {
            console.log('🔄 Resetting all staff points...');
            
            const count = await Staff.resetAllPoints();
            
            console.log(`✅ Reset points for ${count} staff members`);
            
        } catch (error) {
            console.error('❌ Error resetting points:', error);
        }
    }
}
