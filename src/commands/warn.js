import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import Staff from '../database/Staff.js';
import { createModerationEmbed, createErrorEmbed } from '../utils/embeds.js';
import { generateActionCard } from '../utils/actionImage.js';

export default {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a member')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const target = interaction.options.getUser('target');
            const reason = interaction.options.getString('reason');
            const moderator = interaction.user;

            // Check if user has Warn Role OR is Administrator
            if (!interaction.member.roles.cache.has(process.env.WARN_ROLE_ID) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
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

            const actionCard = await generateActionCard('Member Warned', target, [
                { name: 'Moderator', value: interaction.member.displayName },
                { name: 'Reason', value: reason },
                { name: 'Action', value: 'Formal Warning' }
            ], '#f1c40f');

            // Send to log channel
            const logChannel = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
            if (logChannel) {
                await logChannel.send({ files: [actionCard] });
            }

            // Try to DM the user
            try {
                const dmEmbed = createModerationEmbed('WARNING', moderator, target, reason, 0);
                await target.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log(`Could not DM ${target.tag}`);
            }

            await interaction.editReply({ files: [actionCard] });

        } catch (error) {
            console.error('Error in warn command:', error);
            await interaction.editReply({
                embeds: [createErrorEmbed('Error', 'An error occurred while executing the warn command')]
            });
        }
    }
};
