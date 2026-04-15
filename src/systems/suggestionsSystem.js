import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ThreadAutoArchiveDuration } from 'discord.js';

export class SuggestionsSystem {
    constructor(client) {
        this.client = client;
        this.suggestionChannelId = process.env.SUGGESTION_CHANNEL_ID;
        this.approverRoleId = process.env.APPROVER_ROLE_ID;
        this.userVotes = {};

        this.client.on('messageCreate', message => this.handleMessage(message));
        this.client.on('interactionCreate', interaction => this.handleInteraction(interaction));
    }

    async handleMessage(message) {
        if (message.author.bot || message.channel.id !== this.suggestionChannelId) return;

        const messageContent = message.content;
        const attachment = message.attachments.first();

        if (!messageContent.trim() && !attachment) return;

        const suggestionEmbed = new EmbedBuilder()
            .setColor(0x00B2FF)
            .setTitle('📝 اقتراح جديد')
            .setDescription(`**الاقتراح :**\n\`\`\`${messageContent}\`\`\``)
            .setTimestamp()
            .setFooter({ text: `- One Roleplay Team` })
            .setThumbnail(message.author.displayAvatarURL())
            .addFields(
                { name: 'المُقترح :', value: message.author.toString(), inline: true },
                { name: 'الحالة :', value: '⏳ قيد الانتظار', inline: true },
                { name: 'الدعم :', value: '👍 0 | 👎 0', inline: true }
            );
        
        if (attachment && attachment.contentType?.startsWith('image/')) {
            suggestionEmbed.setImage(attachment.url);
        }

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('upvote')
                    .setLabel('👍')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('downvote')
                    .setLabel('👎')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`settings_${message.author.id}`)
                    .setLabel('⚙️')
                    .setStyle(ButtonStyle.Secondary)
            );

        try {
            const sentMessage = await message.channel.send({ embeds: [suggestionEmbed], components: [row] });
            await message.delete().catch(() => {});
            
            await sentMessage.startThread({
                name: `Suggestion-${message.author.username}`,
                autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
                reason: 'Suggestion discussion thread'
            }).catch(err => console.error('Failed to create thread:', err));
        } catch (error) {
            console.error('Error sending suggestion:', error);
        }
    }

    async handleInteraction(interaction) {
        if (!interaction.isButton()) return;

        const { customId, message, user, member } = interaction;
        const messageId = message.id;
        const userId = user.id;

        if (customId.startsWith('settings')) {
            if (!member.roles.cache.has(this.approverRoleId)) {
                return interaction.reply({ content: 'ليس لديك صلاحية لاستخدام هذا الزر.', ephemeral: true });
            }
            
            const originalUserId = customId.split('_')[1];
            
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`accept_${originalUserId}_${messageId}`)
                        .setLabel('قبول')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`reject_${originalUserId}_${messageId}`)
                        .setLabel('رفض')
                        .setStyle(ButtonStyle.Danger)
                );
            
            await interaction.reply({ content: 'هل تريد قبول أو رفض هذا الاقتراح؟', ephemeral: true, components: [actionRow] });
        } else if (customId.startsWith('accept_') || customId.startsWith('reject_')) {
            if (!member.roles.cache.has(this.approverRoleId)) {
                return interaction.reply({ content: 'ليس لديك صلاحية لاستخدام هذا الزر.', ephemeral: true });
            }
            
            const isAccept = customId.startsWith('accept_');
            const decision = isAccept ? 'تم القبول' : 'تم الرفض';
            const color = isAccept ? 0x28A745 : 0xDC3545;
            
            const parts = customId.split('_');
            const originalUserId = parts[1];
            const originalMessageId = parts[2];
            
            const originalMessage = await interaction.channel.messages.fetch(originalMessageId).catch(() => null);
            if (!originalMessage) return interaction.reply({ content: 'لا يمكن العثور على الاقتراح الأصلي.', ephemeral: true });

            const originalEmbed = originalMessage.embeds[0];
            
            const updatedButtons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('upvote').setLabel('👍').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId('downvote').setLabel('👎').setStyle(ButtonStyle.Primary)
                );

            const updatedEmbed = EmbedBuilder.from(originalEmbed)
                .setColor(color)
                .spliceFields(1, 1, { name: 'الحالة', value: decision, inline: true });

            await interaction.update({ content: `The suggestion has been ${isAccept ? 'accepted' : 'rejected'}.`, components: [] });
            await originalMessage.edit({ embeds: [updatedEmbed], components: [updatedButtons] });
            
            // Send DM to author
            const author = await interaction.guild.members.fetch(originalUserId).catch(() => null);
            if (author) {
                const dmEmbed = new EmbedBuilder()
                    .setColor(color)
                    .setTitle('تم الرد على اقتراحك')
                    .setDescription(`**${decision}**\n\n[**الإنتقال إلى اقتراحك**](${originalMessage.url})`)
                    .setTimestamp();
                
                await author.send({ content: author.toString(), embeds: [dmEmbed] }).catch(() => {});
            }
        } else if (customId === 'upvote' || customId === 'downvote') {
            if (!this.userVotes[messageId]) this.userVotes[messageId] = {};
            
            const previousVote = this.userVotes[messageId][userId];
            if (previousVote === customId) {
                return interaction.reply({ content: 'لقد قمت بالتصويت على هذا الاقتراح بالفعل.', ephemeral: true });
            }
            
            const originalEmbed = message.embeds[0];
            const fields = originalEmbed.fields;
            let upvotes = parseInt(fields[2].value.split('|')[0].trim().split(' ')[1]);
            let downvotes = parseInt(fields[2].value.split('|')[1].trim().split(' ')[1]);
            
            if (previousVote) {
                if (previousVote === 'upvote') upvotes--;
                else downvotes--;
            }
            
            if (customId === 'upvote') {
                upvotes++;
                this.userVotes[messageId][userId] = 'upvote';
            } else {
                downvotes++;
                this.userVotes[messageId][userId] = 'downvote';
            }

            const updatedEmbed = EmbedBuilder.from(originalEmbed)
                .spliceFields(2, 1, { name: 'الدعم', value: `👍 ${upvotes} | 👎 ${downvotes}`, inline: true });

            await interaction.update({ embeds: [updatedEmbed] });
        }
    }
}
