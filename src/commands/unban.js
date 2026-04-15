import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import Staff from '../database/Staff.js';
import { createModerationEmbed, createErrorEmbed } from '../utils/embeds.js';
import { generateActionCard } from '../utils/actionImage.js';

export default {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('The user ID to unban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the unban')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const userId = interaction.options.getString('userid');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            const moderator = interaction.user;

            // Check if user has Ban Role OR is Administrator
            if (!interaction.member.roles.cache.has(process.env.BAN_ROLE_ID) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('Permission Denied', 'You do not have the required role or Administrator permissions.')]
                });
            }

            // Check if user is banned
            const bans = await interaction.guild.bans.fetch();
            const bannedUser = bans.get(userId);

            if (!bannedUser) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('Error', 'This user is not banned')]
                });
            }

            // Unban the user
            await interaction.guild.members.unban(userId, `${moderator.tag}: ${reason}`);

            const actionCard = await generateActionCard('User Unbanned', bannedUser.user, [
                { name: 'Moderator', value: interaction.member.displayName },
                { name: 'Reason', value: reason },
                { name: 'Status', value: 'Unbanned' }
            ], '#3498db');

            // Send to log channel
            const logChannel = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
            if (logChannel) {
                await logChannel.send({ files: [actionCard] });
            }

            await interaction.editReply({ files: [actionCard] });

        } catch (error) {
            console.error('Error in unban command:', error);
            await interaction.editReply({
                embeds: [createErrorEmbed('Error', 'An error occurred while executing the unban command')]
            });
        }
    }
};
