import { EmbedBuilder } from 'discord.js';

class Logger {
    static async logTicket(guild, { action, user, ticketId, category = null, rating = null, admin = null, feedback = null, period = null }) {
        // Check if guild exists
        if (!guild) {
            console.error('Error: Guild is null in logTicket');
            return;
        }
        
        // Handle ratings specially - send to the designated ratings channel
        if (action === 'RATE' || rating) {
            const ratingsChannelId = '1446875134869639330';
            const ratingsChannel = guild.channels.cache.get(ratingsChannelId);
            
            if (ratingsChannel) {
                const ratingEmbed = new EmbedBuilder()
                    .setTitle('New Rating Received')
                    .setColor(0xff2f5b) // Updated color
                    .addFields(
                        { name: 'User', value: user.toString(), inline: true },
                        { name: 'Administrator', value: '<@&1439985934681509988>', inline: true },
                        { name: '\u200B', value: '\u200B', inline: true }, // Empty field for spacing
                        { name: 'Category', value: category || 'غير محدد', inline: true },
                        { name: 'Rating', value: '⭐'.repeat(rating), inline: true },
                        { name: '\u200B', value: '\u200B', inline: true } // Empty field for spacing
                    )
                    .setTimestamp();
                
                if (feedback) {
                    ratingEmbed.addFields({ name: 'Comment', value: feedback });
                }
                
                try {
                    await ratingsChannel.send({ embeds: [ratingEmbed] });
                } catch (error) {
                    console.error('Error sending rating to channel:', error);
                }
            }
        }
    }

    static async updateStatistics(guild, rating) {
        // Check if guild exists
        if (!guild) {
            console.error('Error: Guild is null in updateStatistics');
            return;
        }
        
        const now = new Date();
        const month = now.toLocaleString('ar-SA', { month: 'long' });
        const year = now.getFullYear();

        let statsChannel = guild.channels.cache.find(channel => channel.name === 'ticket-statistics');
        
        if (!statsChannel) {
            statsChannel = await guild.channels.create({
                name: 'ticket-statistics',
                type: 0,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: ['SendMessages'],
                        allow: ['ViewChannel']
                    }
                ]
            });
        }

        const statsEmbed = new EmbedBuilder()
            .setTitle('📊 إحصائيات التذاكر')
            .setDescription(`إحصائيات شهر ${month} ${year}`)
            .addFields(
                { name: '📈 متوسط التقييم', value: `⭐ ${rating}`, inline: true },
                { name: '🎫 عدد التذاكر', value: '1', inline: true }
            )
            .setColor(0xff2f5b) // Updated color
            .setTimestamp()
            .setFooter({ 
                text: 'ONE Support Team', 
                iconURL: 'https://cdn.discordapp.com/icons/1157764250899587168/a_70347d99d756911cc13387dd212fdda2.gif?animated=true&size=1024'
            });

        // Find or create monthly stats message
        const messages = await statsChannel.messages.fetch({ limit: 1 });
        const statsMessage = messages.first();

        if (statsMessage) {
            await statsMessage.edit({ embeds: [statsEmbed] });
        } else {
            await statsChannel.send({ embeds: [statsEmbed] });
        }
    }
}

export default Logger;
