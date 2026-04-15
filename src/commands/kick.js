import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import Staff from '../database/Staff.js';
import { createModerationEmbed, createErrorEmbed } from '../utils/embeds.js';
import { generateActionCard } from '../utils/actionImage.js';

export default {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const target = interaction.options.getUser('target');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            const moderator = interaction.user;

            // Check if user has Kick Role OR is Administrator
            if (!interaction.member.roles.cache.has(process.env.KICK_ROLE_ID) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
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

            if (!member.kickable) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('Error', 'I cannot kick this member. They may have higher permissions than me.')]
                });
            }

            await member.kick(`${moderator.tag}: ${reason}`);

            const actionCard = await generateActionCard('Member Kicked', target, [
                { name: 'Moderator', value: interaction.member.displayName },
                { name: 'Reason', value: reason },
                { name: 'Action', value: 'Kicked from server' }
            ], '#ffa502');

            const logChannel = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
            if (logChannel) {
                await logChannel.send({ files: [actionCard] });
            }

            await interaction.editReply({ files: [actionCard] });

        } catch (error) {
            console.error('Error in kick command:', error);
            await interaction.editReply({
                embeds: [createErrorEmbed('Error', 'An error occurred while executing the kick command')]
            });
        }
    }
};
