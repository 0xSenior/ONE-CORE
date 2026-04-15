import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import Staff from '../database/Staff.js';
import { createModerationEmbed, createErrorEmbed } from '../utils/embeds.js';
import { generateActionCard } from '../utils/actionImage.js';

export default {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a member')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Duration in minutes')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(40320)) // Max 28 days
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the timeout')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const target = interaction.options.getUser('target');
            const duration = interaction.options.getInteger('duration');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            const moderator = interaction.user;

            // Check if user has Mute Role OR is Administrator
            if (!interaction.member.roles.cache.has(process.env.MUTE_ROLE_ID) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('Permission Denied', 'You do not have the required role or Administrator permissions.')]
                });
            }

            const member = await interaction.guild.members.fetch(target.id).catch(() => null);

            if (!member) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('Error', 'Could not find that member')]
                });
            }

            if (!member.moderatable) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('Error', 'I cannot timeout this member. They may have higher permissions than me.')]
                });
            }

            await member.timeout(duration * 60 * 1000, `${moderator.tag}: ${reason}`);

            const actionCard = await generateActionCard('Member Muted', target, [
                { name: 'Moderator', value: interaction.member.displayName },
                { name: 'Duration', value: `${duration} Minutes` },
                { name: 'Reason', value: reason },
                { name: 'Status', value: 'Timed Out' }
            ], '#9b59b6');

            // Send to log channel
            const logChannel = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
            if (logChannel) {
                await logChannel.send({ files: [actionCard] });
            }

            await interaction.editReply({ files: [actionCard] });

        } catch (error) {
            console.error('Error in timeout command:', error);
            await interaction.editReply({
                embeds: [createErrorEmbed('Error', 'An error occurred while executing the timeout command')]
            });
        }
    }
};
