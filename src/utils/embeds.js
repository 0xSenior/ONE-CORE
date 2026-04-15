import { EmbedBuilder, userMention } from 'discord.js';

const FOOTER_ICON = 'https://cdn.discordapp.com/icons/1157764250899587168/a_46e7bd28f3c5c5602b54a491ab68a001.gif?animated=true&size=1024';

/**
 * Create a success embed
 */
export function createSuccessEmbed(title, description, fields = []) {
    const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle(`✅ ${title}`)
        .setDescription(description)
        .setTimestamp()
        .setFooter({ text: 'Admin Bot System', iconURL: FOOTER_ICON });

    if (fields.length > 0) {
        embed.addFields(fields);
    }

    return embed;
}

/**
 * Create an error embed
 */
export function createErrorEmbed(title, description) {
    return new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`❌ ${title}`)
        .setDescription(description)
        .setTimestamp()
        .setFooter({ text: 'Admin Bot System', iconURL: FOOTER_ICON });
}

/**
 * Create an info embed
 */
export function createInfoEmbed(title, description, fields = []) {
    const embed = new EmbedBuilder()
        .setColor('#3498db')
        .setTitle(`${title}`)
        .setDescription(description)
        .setTimestamp()
        .setFooter({ text: 'Admin Bot System', iconURL: FOOTER_ICON });

    if (fields.length > 0) {
        embed.addFields(fields);
    }

    return embed;
}

/**
 * Create a moderation log embed
 */
export function createModerationEmbed(action, moderator, target, reason, points) {
    const targetTag = target.tag || target.user?.tag || 'Unknown';
    const targetId = target.id || 'N/A';
    
    return new EmbedBuilder()
        .setColor('#e74c3c')
        .setTitle(`🛡️ Moderation Action: ${action}`)
        .addFields(
            { name: '**__👮 Moderator__**', value: `${userMention(moderator.id)}`, inline: true },
            { name: '**__👤 Target__**', value: targetId !== 'N/A' ? `${userMention(targetId)}` : `${targetTag}`, inline: true },
            { name: '**__📝 Reason__**', value: reason || 'No reason provided', inline: false },
        )
        .setTimestamp()
        .setFooter({ text: 'Moderation System', iconURL: FOOTER_ICON });
}

/**
 * Create a points display embed
 */
export function createPointsEmbed(user, staff) {
    return new EmbedBuilder()
        .setColor('#f39c12')
        .setTitle('⭐ Staff Points Overview')
        .setThumbnail(user.displayAvatarURL())
        .addFields(
            { name: '**__👤 Staff Member__**', value: `${userMention(user.id)}`, inline: false },
            { name: '**__🛡️ Bonus Points__**', value: `\`\`\`${staff.adminPoints}\`\`\``, inline: true },
            { name: '**__🎤 Voice Points__**', value: `\`\`\`${staff.voicePoints}\`\`\``, inline: true },
            { name: '**__💬 Messages__**', value: `\`\`\`${staff.messagePoints}\`\`\``, inline: true },
            { name: '**__🏆 Total Points__**', value: `\`\`\`${staff.totalPoints}\`\`\``, inline: false },
            { name: '**__📊 Statistics__**', value: `\`\`\`yml\nMessages: ${staff.messageCount}\nWords: ${staff.wordCount}\nVoice Time: ${Math.floor(staff.voiceMinutes / 60)}h ${staff.voiceMinutes % 60}m\`\`\``, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: 'Points System', iconURL: FOOTER_ICON });
}

/**
 * Create a login/logout embed
 */
export function createLoginEmbed(user, staff, isLogin = true) {
    if (isLogin) {
        return new EmbedBuilder()
            .setColor('#2ecc71')
            .setTitle('🟢 Admin Login')
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: '**__👤 Member__**', value: `${userMention(user.id)}`, inline: true },
                { name: '**__⏰ Login Time__**', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                { name: '**__🏆 Total Points__**', value: `\`\`\`${staff.totalPoints}\`\`\``, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Admin Shift System', iconURL: FOOTER_ICON });
    } else {
        return new EmbedBuilder()
            .setColor('#e67e22')
            .setTitle('🔴 Admin Logout')
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: 'Admin Shift System', iconURL: FOOTER_ICON });
    }
}

/**
 * Format duration in a readable way
 */
export function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    const h = hours;
    const m = minutes % 60;
    const s = seconds % 60;

    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}
