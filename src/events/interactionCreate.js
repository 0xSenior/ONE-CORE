import { Events, MessageFlags } from 'discord.js';
import Staff from '../database/Staff.js';
import ticketManager from '../managers/ticketManager.js';
import { createLoginEmbed, createErrorEmbed, formatDuration } from '../utils/embeds.js';
import { generateActionCard } from '../utils/actionImage.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // --- 1. HANDLE SLASH COMMANDS ---
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}:`, error);
                const errorMessage = {
                    content: '❌ There was an error while executing this command!',
                    flags: MessageFlags.Ephemeral
                };
                if (interaction.replied || interaction.deferred) await interaction.followUp(errorMessage).catch(() => {});
                else await interaction.reply(errorMessage).catch(() => {});
            }
            return;
        }

        // --- 2. HANDLE SELECT MENUS (Tickets Case) ---
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'ticket_category') {
                await ticketManager.handleCategorySelect(interaction);
            }
            return;
        }

        // --- 3. HANDLE BUTTONS ---
        if (interaction.isButton()) {
            const { customId } = interaction;

            // Staff System Buttons
            if (customId === 'staff_login' || customId === 'staff_logout') {
                await handleStaffShift(interaction);
                return;
            }

            // Ticket System Buttons
            if (customId === 'create_ticket') {
                await ticketManager.createTicket(interaction);
                return;
            }
            if (customId === 'claim_ticket') {
                await ticketManager.claimTicket(interaction);
                return;
            }
            if (customId === 'close_ticket') {
                await ticketManager.closeTicket(interaction);
                return;
            }

            if (customId === 'unclaim_ticket') {
                await ticketManager.unclaimTicket(interaction);
                return;
            }
            if (customId === 'add_user') {
                await ticketManager.addUserPrompt(interaction);
                return;
            }
            if (customId === 'save_transcript') {
                await ticketManager.saveTranscript(interaction);
                return;
            }
            if (customId === 'archive_ticket') {
                await ticketManager.archiveTicket(interaction);
                return;
            }

            // Suggestions handled via the SuggestionsSystem's listener in index.js
        }

        // --- 4. HANDLE MODALS ---
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'add_user_modal') {
                await ticketManager.addUserToTicket(interaction);
            }
            return;
        }
    }
};

/**
 * Staff Shift Logic (extracted for cleanliness)
 */
async function handleStaffShift(interaction) {
    try {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const user = interaction.user;
        const customId = interaction.customId;

        if (!interaction.member?.roles.cache.has(process.env.STAFF_ROLE_ID)) {
            return interaction.editReply({
                embeds: [createErrorEmbed('Error', 'You must be a staff member to use this system')]
            });
        }

        const staff = await Staff.getOrCreate(user.id);

        if (customId === 'staff_login') {
            if (staff.currentLoginTimestamp) {
                return interaction.editReply({ embeds: [createErrorEmbed('Error', 'You are already logged in!')] });
            }
            staff.currentLoginTimestamp = Date.now();
            await staff.save();

            if (interaction.client.shiftSystem) interaction.client.shiftSystem.startTracking(user.id);

            const actionCard = await generateActionCard('Admin Login', user, [
                { name: 'Status', value: 'Active Shift' },
                { name: 'Total Points', value: staff.totalPoints.toString() },
                { name: 'Time', value: new Date().toLocaleTimeString() }
            ], '#2ecc71');

            const loginChannel = interaction.guild.channels.cache.get(process.env.LOGIN_CHANNEL_ID);
            if (loginChannel) {
                const loginMsg = await loginChannel.send({ files: [actionCard] });
                staff.lastLoginMessageId = loginMsg.id;
                await staff.save();
            }
            await interaction.editReply({ files: [actionCard] });

        } else if (customId === 'staff_logout') {
            if (!staff.currentLoginTimestamp) {
                return interaction.editReply({ embeds: [createErrorEmbed('Error', 'You are not logged in!')] });
            }

            const sessionDuration = Date.now() - staff.currentLoginTimestamp;
            const formattedDuration = formatDuration(sessionDuration);
            const sessionHours = sessionDuration / (1000 * 60 * 60);
            const sessionPoints = Math.floor(sessionHours * (process.env.POINTS_PER_HOUR_VOICE || 5));

            if (sessionPoints > 0) await staff.addPoints('admin', sessionPoints);

            staff.currentLoginTimestamp = null;
            await staff.save();

            if (interaction.client.shiftSystem) interaction.client.shiftSystem.stopTracking(user.id);

            const actionCard = await generateActionCard('Admin Logout', user, [
                { name: 'Duration', value: formattedDuration },
                { name: 'Points Earned', value: `+${sessionPoints} Bonus` },
                { name: 'Total Points', value: staff.totalPoints.toString() },
                { name: 'Session End', value: new Date().toLocaleTimeString() }
            ], '#e67e22');

            const loginChannel = interaction.guild.channels.cache.get(process.env.LOGIN_CHANNEL_ID);
            if (loginChannel) {
                if (staff.lastLoginMessageId) {
                    try {
                        await loginChannel.send({ files: [actionCard], reply: { messageReference: staff.lastLoginMessageId } });
                    } catch (e) { await loginChannel.send({ files: [actionCard] }); }
                    staff.lastLoginMessageId = null;
                    await staff.save();
                } else await loginChannel.send({ files: [actionCard] });
            }
            await interaction.editReply({ files: [actionCard] });
        }
    } catch (error) {
        console.error('Error in staff button interaction:', error);
        await interaction.editReply({ embeds: [createErrorEmbed('Error', 'An error occurred while processing your request')] });
    }
}
