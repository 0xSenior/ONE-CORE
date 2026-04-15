import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createInfoEmbed, createErrorEmbed } from '../utils/embeds.js';

export default {
    data: new SlashCommandBuilder()
        .setName('come')
        .setDescription('Send a DM to a staff member with a message and optional image')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to send the message to')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message to send')
                .setRequired(false))
        .addAttachmentOption(option =>
            option.setName('image')
                .setDescription('Optional image to attach')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            // Check if user is authorized (specific user ID, role ID, or Administrator)
            const authorizedUserId = '1018435728776114208';
            const authorizedRoleId = '1446903299860074597';
            const isAuthorized = interaction.user.id === authorizedUserId || 
                                 interaction.member.roles.cache.has(authorizedRoleId) ||
                                 interaction.member.permissions.has(PermissionFlagsBits.Administrator);

            if (!isAuthorized) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('Permission Denied', 'You do not have permission to use this command.')]
                });
            }

            const targetUser = interaction.options.getUser('user');
            const message = interaction.options.getString('message');
            const attachment = interaction.options.getAttachment('image');

            // Try to send DM
            try {
                let dmContent = '';
                
                if (message) {
                    dmContent = `${message}\n\n**تم استدعاؤك بواسطة ${interaction.user.toString()} في الروم <#${interaction.channel.id}> . يرجى الانضمام حالاً**\n\n${targetUser.toString()}`;
                } else {
                    dmContent = `**تم استدعاؤك بواسطة ${interaction.user.toString()} في الروم <#${interaction.channel.id}> . يرجى الانضمام حالاً**\n\n${targetUser.toString()}`;
                }
                
                const dmOptions = {
                    content: dmContent
                };

                if (attachment) {
                    dmOptions.files = [attachment];
                }

                await targetUser.send(dmOptions);

                // Send confirmation
                const confirmEmbed = createInfoEmbed(
                    '✅ Message Sent',
                    `Successfully sent your message to ${targetUser.toString()}`
                );

                if (attachment) {
                    confirmEmbed.addFields({
                        name: '📎 Attachment',
                        value: `[${attachment.name}](${attachment.url})`
                    });
                }

                await interaction.editReply({ embeds: [confirmEmbed] });

            } catch (dmError) {
                console.error('Failed to send DM:', dmError);
                await interaction.editReply({
                    embeds: [createErrorEmbed(
                        'Failed to Send',
                        `Could not send a DM to ${targetUser.toString()}. Their DMs might be closed.`
                    )]
                });
            }

        } catch (error) {
            console.error('Error in come command:', error);
            await interaction.editReply({
                embeds: [createErrorEmbed('Error', 'An error occurred while sending the message.')]
            });
        }
    }
};
