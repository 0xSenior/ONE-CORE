import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import Staff from '../database/Staff.js';
import { createModerationEmbed, createErrorEmbed } from '../utils/embeds.js';

export default {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear messages from a channel')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Only delete messages from this user')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            // Check if user has Clear Role OR is Administrator
            if (!interaction.member.roles.cache.has(process.env.CLEAR_ROLE_ID) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('Permission Denied', 'You do not have the required role or Administrator permissions.')]
                });
            }

            const amount = interaction.options.getInteger('amount');
            const target = interaction.options.getUser('target');
            const moderator = interaction.user;

            let messages = await interaction.channel.messages.fetch({ limit: amount });

            if (target) {
                messages = messages.filter(msg => msg.author.id === target.id);
            }

            const deleted = await interaction.channel.bulkDelete(messages, true);

            const deletedCount = deleted.size;

            const logEmbed = createModerationEmbed(
                'CLEAR MESSAGES',
                moderator,
                target || { tag: 'All Users', id: 'N/A' },
                `Deleted ${deletedCount} messages`,
                0
            );

            const logChannel = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
            if (logChannel) {
                await logChannel.send({ embeds: [logEmbed] });
            }

            await interaction.editReply({
                embeds: [createModerationEmbed(
                    'CLEAR MESSAGES',
                    moderator,
                    target || { tag: 'All Users', id: 'N/A' },
                    `Successfully deleted ${deletedCount} messages`,
                    0
                )]
            });

        } catch (error) {
            console.error('Error in clear command:', error);
            await interaction.editReply({
                embeds: [createErrorEmbed('Error', 'An error occurred while clearing messages. Messages older than 14 days cannot be bulk deleted.')]
            });
        }
    }
};
