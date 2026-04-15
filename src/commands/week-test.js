import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createErrorEmbed, createInfoEmbed } from '../utils/embeds.js';

export default {
    data: new SlashCommandBuilder()
        .setName('week-test')
        .setDescription('Test the weekly leaderboard system (Admin only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: false });

            // Check if user has administrator permissions
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('Permission Denied', 'Only administrators can use this command.')]
                });
            }

            // Check if weekly leaderboard system exists
            if (!interaction.client.weeklyLeaderboard) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('System Error', 'Weekly leaderboard system is not initialized.')]
                });
            }

            // Send test message
            await interaction.editReply({
                embeds: [createInfoEmbed('🧪 اختبار نظام التوب الأسبوعي', 'جاري إرسال التوب التجريبي...')]
            });

            // Trigger the leaderboard posting
            await interaction.client.weeklyLeaderboard.postLeaderboard();

            // Send confirmation
            await interaction.followUp({
                embeds: [createInfoEmbed('✅ تم الاختبار', 'تم إرسال التوب التجريبي بنجاح!')],
                ephemeral: true
            });

        } catch (error) {
            console.error('Error in week-test command:', error);
            await interaction.editReply({
                embeds: [createErrorEmbed('Error', 'An error occurred while testing the weekly leaderboard system')]
            });
        }
    }
};
