import { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { generateShiftPanel } from '../utils/shiftImage.js';
import { createErrorEmbed } from '../utils/embeds.js';

export default {
    data: new SlashCommandBuilder()
        .setName('setup-login')
        .setDescription('Setup the staff login/logout panel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            // ID check for authorized user
            const authorizedUserId = '1018435728776114208';
            if (interaction.user.id !== authorizedUserId && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('Permission Denied', 'This command is restricted to the specific authorized maintainer.')]
                });
            }

            // Generate the premium panel image
            const panelImage = await generateShiftPanel();

            // Buttons Configuration
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('staff_login')
                        .setLabel('تسجيل الدخول')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('staff_logout')
                        .setLabel('تسجيل الخروج')
                        .setStyle(ButtonStyle.Secondary)
                );

            // Send to the current channel
            await interaction.channel.send({
                files: [panelImage],
                components: [row]
            });

            await interaction.editReply({ content: '✅ Login panel setup successfully!' });

        } catch (error) {
            console.error('Error setting up login panel:', error);
            await interaction.editReply({
                embeds: [createErrorEmbed('Setup Error', 'An error occurred while setting up the login panel.')]
            });
        }
    }
};
