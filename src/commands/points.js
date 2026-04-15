import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import Staff from '../database/Staff.js';
import { createPointsEmbed, createErrorEmbed, createInfoEmbed } from '../utils/embeds.js';
import { generateLeaderboard } from '../utils/leaderboardImage.js';
import { generateProfileCard } from '../utils/profileImage.js';
import { generatePointsActionCard } from '../utils/pointsActionImage.js';
import { EmbedBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('points')
        .setDescription('Manage staff points')
        .addSubcommand(subcommand =>
            subcommand
                .setName('me')
                .setDescription('View your own points and profile stats'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('check')
                .setDescription('Check staff member points')
                .addUserOption(option =>
                    option.setName('staff')
                        .setDescription('The staff member to check')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('top')
                .setDescription('Show top 10 staff members by points'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Manually add points to a staff member')
                .addUserOption(option =>
                    option.setName('staff')
                        .setDescription('The staff member')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Amount of points to add')
                        .setRequired(true)
                        .setMinValue(1))
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Type of points')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Bonus Points', value: 'admin' },
                            { name: 'Voice Points', value: 'voice' },
                            { name: 'Message Points', value: 'message' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Manually remove points from a staff member')
                .addUserOption(option =>
                    option.setName('staff')
                        .setDescription('The staff member')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Amount of points to remove')
                        .setRequired(true)
                        .setMinValue(1))
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Type of points')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Bonus Points', value: 'admin' },
                            { name: 'Voice Points', value: 'voice' },
                            { name: 'Message Points', value: 'message' }
                        )))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: false });

            const authorizedUserId = '1018435728776114208';
            const staffRoleId = process.env.STAFF_ROLE_ID;
            const subcommand = interaction.options.getSubcommand();

            // 1. General Staff Check (for check/top)
            const isStaff = interaction.member.roles.cache.has(staffRoleId) ||
                interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
                interaction.user.id === authorizedUserId;

            if (!isStaff) {
                return interaction.editReply({
                    embeds: [createErrorEmbed('Permission Denied', 'You do not have permission to use the points system.')]
                });
            }

            // 2. Management Check (for add/remove - ONLY authorized user)
            if (['add', 'remove'].includes(subcommand)) {
                if (interaction.user.id !== authorizedUserId) {
                    return interaction.editReply({
                        embeds: [createErrorEmbed('Permission Denied', 'Only the authorized user can add or remove points')]
                    });
                }
            }

            // 3. Check/Top Management Check
            if (['check', 'top'].includes(subcommand)) {
                const managementRoleId = '1446659843745251442';
                const isManager = interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
                    interaction.user.id === authorizedUserId ||
                    interaction.member.roles.cache.has(managementRoleId);

                if (!isManager) {
                    return interaction.editReply({
                        embeds: [createErrorEmbed('Permission Denied', 'Only management or Administrators can use this command.')]
                    });
                }
            }

            if (subcommand === 'me') {
                await this.handleCheck(interaction, interaction.user);
            } else if (subcommand === 'check') {
                const target = interaction.options.getUser('staff');
                await this.handleCheck(interaction, target);
            } else if (subcommand === 'top') {
                await this.handleTop(interaction);
            } else if (subcommand === 'add') {
                await this.handleAdd(interaction);
            } else if (subcommand === 'remove') {
                await this.handleRemove(interaction);
            }
        } catch (error) {
            console.error('Error in points command:', error);
            await interaction.editReply({
                embeds: [createErrorEmbed('Error', 'An error occurred while executing the points command')]
            });
        }
    },

    async handleCheck(interaction, user = null) {
        const target = user || interaction.options.getUser('staff');
        const staff = await Staff.getOrCreate(target.id);

        try {
            const attachment = await generateProfileCard(target, staff);
            await interaction.editReply({ files: [attachment], embeds: [] });
        } catch (error) {
            console.error('Error generating profile card:', error);
            await interaction.editReply({
                content: '⚠️ Failed to generate image.',
                embeds: [createPointsEmbed(target, staff)] // Fallback to old embed
            });
        }
    },

    async handleTop(interaction) {
        const topStaff = await Staff.find({}).sort({ totalPoints: -1 }).limit(10);

        if (topStaff.length === 0) {
            return interaction.editReply({
                content: '',
                embeds: [createInfoEmbed('Top Staff', 'No staff members found in the database yet.')]
            });
        }

        // Parallel Fetching and Filtering for Staff Only 🚀
        const preparedUsers = (await Promise.all(topStaff.map(async (staff) => {
            const member = await interaction.guild.members.fetch(staff.userId).catch(() => null);
            if (!member || !member.roles.cache.has(process.env.STAFF_ROLE_ID)) return null;

            return {
                username: member.displayName,
                avatarURL: member.user.displayAvatarURL({ extension: 'png', size: 128 }),
                totalPoints: staff.totalPoints,
                adminPoints: staff.adminPoints,
                voicePoints: staff.voicePoints,
                messagePoints: staff.messagePoints
            };
        }))).filter(user => user !== null);

        if (preparedUsers.length === 0) {
            return interaction.editReply({
                content: '',
                embeds: [createInfoEmbed('Top Staff', 'No staff members found with points yet.')]
            });
        }

        const FOOTER_ICON = 'https://cdn.discordapp.com/icons/1157764250899587168/a_70347d99d756911cc13387dd212fdda2.gif?animated=true&size=1024';

        try {
            const attachment = await generateLeaderboard(preparedUsers);

            await interaction.editReply({
                content: '',
                files: [attachment]
            });
        } catch (error) {
            console.error('Error generating leaderboard image:', error);
            await interaction.editReply({
                content: '',
                embeds: [createErrorEmbed('Image Error', 'Could not generate leaderboard image.')]
            });
        }
    },

    async handleAdd(interaction) {
        const target = interaction.options.getUser('staff');
        const amount = interaction.options.getInteger('amount');
        const type = interaction.options.getString('type');

        const staff = await Staff.getOrCreate(target.id);
        await staff.addPoints(type, amount);

        const typeNames = {
            admin: 'Bonus',
            voice: 'Voice',
            message: 'Message'
        };

        try {
            const attachment = await generatePointsActionCard(target, staff, {
                type: 'add',
                amount,
                pointType: type,
                typeNames
            });

            await interaction.editReply({ files: [attachment], embeds: [] });
        } catch (error) {
            console.error('Error generating points action image:', error);
            const embed = createInfoEmbed(
                'Points Added',
                `Successfully added **__( ${amount} )__** ${typeNames[type]} points to ${target}`,
                [
                    { name: '**__🏆 New Total Points__**', value: `\`\`\`${staff.totalPoints}\`\`\``, inline: true },
                    { name: '**__⭐ New Points__**', value: `\`\`\`${staff[type + 'Points']}\`\`\``, inline: true }
                ]
            );
            await interaction.editReply({ embeds: [embed] });
        }
    },

    async handleRemove(interaction) {
        const target = interaction.options.getUser('staff');
        const amount = interaction.options.getInteger('amount');
        const type = interaction.options.getString('type');

        const staff = await Staff.getOrCreate(target.id);

        // Remove points (add negative amount)
        await staff.addPoints(type, -amount);

        const typeNames = {
            admin: 'Bonus',
            voice: 'Voice',
            message: 'Message'
        };

        try {
            const attachment = await generatePointsActionCard(target, staff, {
                type: 'remove',
                amount,
                pointType: type,
                typeNames
            });

            await interaction.editReply({ files: [attachment], embeds: [] });
        } catch (error) {
            console.error('Error generating points action image:', error);
            const embed = createInfoEmbed(
                'Points Removed',
                `Successfully removed **__( ${amount} )__** ${typeNames[type]} points from ${target}`,
                [
                    { name: '**__🏆 New Total Points__**', value: `\`\`\`${staff.totalPoints}\`\`\``, inline: true },
                    { name: '**__⭐ New Points__**', value: `\`\`\`${staff[type + 'Points']}\`\`\``, inline: true }
                ]
            );
            await interaction.editReply({ embeds: [embed] });
        }
    }
};
