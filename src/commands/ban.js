import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import Staff from '../database/Staff.js';
import { createModerationEmbed, createErrorEmbed } from '../utils/embeds.js';
import { generateActionCard } from '../utils/actionImage.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const target = interaction.options.getUser('target');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            const moderator = interaction.user;

            // Check if user has Ban Role OR is Administrator
            if (!interaction.member.roles.cache.has(process.env.BAN_ROLE_ID) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('Permission Denied', 'You do not have the required role or Administrator permissions.')]
                });
            }

            // Get target member
            const member = await interaction.guild.members.fetch(target.id).catch(() => null);

            if (!member) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('Error', 'Could not find that member')]
                });
            }

            // Check if target is bannable
            if (!member.bannable) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('Error', 'I cannot ban this member. They may have higher permissions than me.')]
                });
            }

            // Ban the member
            await member.ban({ reason: `${moderator.tag}: ${reason}` });

            const actionCard = await generateActionCard('Member Banned', target, [
                { name: 'Moderator', value: interaction.member.displayName },
                { name: 'Reason', value: reason },
                { name: 'Action', value: 'Permanent Ban' }
            ], '#ff4757');

            // Send to log channel
            const logChannel = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
            if (logChannel) {
                await logChannel.send({ files: [actionCard] });
            }

            // Reply to command
            await interaction.editReply({ files: [actionCard] });

        } catch (error) {
            console.error('Error in ban command:', error);
            await interaction.editReply({
                embeds: [createErrorEmbed('Error', 'An error occurred while executing the ban command')]
            });
        }
    }
};
