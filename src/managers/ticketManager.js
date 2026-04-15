import { 
    ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, 
    ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, 
    TextInputStyle, AttachmentBuilder, MessageFlags 
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import discordTranscripts from 'discord-html-transcripts';
import Logger from '../utils/logger.js';
import AutoResponder from '../utils/autoResponder.js';
import settings from '../config/settings.js';
import db from './dbManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TICKET_STATE_PATH = path.join(__dirname, '..', '..', 'database', 'ticket-state.json');
const DEFAULT_TICKET_COLOR = 0xff2f5b;

class TicketManager {
    constructor() {
        if (TicketManager.instance) return TicketManager.instance;
        this.ticketData = new Map();
        this.categories = settings.categories;
        this.loadPersistedTicketState();
        TicketManager.instance = this;
    }

    loadPersistedTicketState() {
        try {
            if (!fs.existsSync(TICKET_STATE_PATH)) return;
            const raw = fs.readFileSync(TICKET_STATE_PATH, 'utf8');
            if (!raw.trim()) return;
            const parsed = JSON.parse(raw);
            const entries = Array.isArray(parsed.ticketData) ? parsed.ticketData : [];
            for (const [key, value] of entries) {
                this.ticketData.set(key, value);
            }
        } catch (error) {
            console.error('Error loading persisted ticket state:', error);
        }
    }

    persistTicketState() {
        try {
            const stateDir = path.dirname(TICKET_STATE_PATH);
            if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });
            const serialized = { ticketData: Array.from(this.ticketData.entries()) };
            fs.writeFileSync(TICKET_STATE_PATH, JSON.stringify(serialized, null, 2), 'utf8');
        } catch (error) {
            console.error('Error persisting ticket state:', error);
        }
    }

    async createTicket(interaction) {
        const closedCategoryId = '1447946668904419338';
        let activeTicketCount = 0;
        for (const [id, ticket] of this.ticketData) {
            if (ticket.userId === interaction.user.id && !ticket.archived && !ticket.closed) {
                activeTicketCount++;
            }
        }

        if (activeTicketCount >= settings.maxTicketsPerUser) {
            return interaction.reply({
                content: `❌ عذراً، لا يمكنك فتح أكثر من ${settings.maxTicketsPerUser} تذاكر في نفس الوقت!`,
                flags: MessageFlags.Ephemeral
            });
        }

        const categorySelect = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('ticket_category')
                .setPlaceholder('اختر تصنيف التذكرة')
                .addOptions(this.categories.map(c => ({ label: c.label, value: c.value, emoji: c.emoji })))
        );

        await interaction.reply({
            content: '**📝 - الرجاء اختيار تصنيف التذكرة**',
            components: [categorySelect],
            flags: MessageFlags.Ephemeral
        });
    }

    async handleCategorySelect(interaction) {
        const categoryValue = interaction.values[0];
        const category = this.categories.find(c => c.value === categoryValue);
        if (!category) return interaction.reply({ content: '❌ القسم غير موجود', flags: MessageFlags.Ephemeral });

        await interaction.update({ content: '**✅ يتم الآن إنشاء تذكرتك...**', components: [] });

        const ticketNumber = db.getNextTicketNumber();
        const formattedTicketNumber = String(ticketNumber).padStart(4, '0');
        
        const channel = await interaction.guild.channels.create({
            name: `ticket-${categoryValue}-${formattedTicketNumber}`,
            type: ChannelType.GuildText,
            parent: settings.ticketCategory,
            permissionOverwrites: [
                { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
                { id: settings.supportRole, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
                { id: interaction.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
            ]
        });

        const welcomeEmbed = new EmbedBuilder()
            .setTitle(`تذكرة جديدة | ${category.label}`)
            .setDescription(`مرحباً بك ${interaction.user} 👋\n\n**تنويه**\n> يرجى الانتظار بصبر، فريق الدعم سيرد عليك في أقرب وقت ممكن\n> **تذكر:** احترام قوانين السيرفر أثناء المحادثة مع فريق الدعم\n\n**معلومات التذكرة**\n**القِسم:** 📁 \`${category.label}\`\n**الحالة:** 🔷 \`مفتوحة\`\n**معرف التذكرة:** 🆔 \`${channel.id}\``)
            .setColor(DEFAULT_TICKET_COLOR)
            .setThumbnail(interaction.guild.iconURL({ forceStatic: false }) || interaction.client.user.displayAvatarURL())
            .setTimestamp();

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('claim_ticket').setLabel('استلام التذكرة').setEmoji('👋').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('unclaim_ticket').setLabel('إلغاء الاستلام').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('add_user').setLabel('إضافة مستخدم').setEmoji('👤').setStyle(ButtonStyle.Primary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('save_transcript').setLabel('حفظ المحادثة').setEmoji('📄').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('archive_ticket').setLabel('أرشفة التذكرة').setEmoji('📦').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('close_ticket').setLabel('إغلاق التذكرة').setEmoji('🔒').setStyle(ButtonStyle.Danger)
        );

        await channel.send({ content: `${interaction.user} | <@&${settings.supportRole}>`, embeds: [welcomeEmbed], components: [row1, row2] });

        this.ticketData.set(channel.id, {
            userId: interaction.user.id,
            channelId: channel.id,
            category: category.label,
            createdAt: new Date(),
            closed: false
        });
        this.persistTicketState();

        db.createTicket(`T-${formattedTicketNumber}`, interaction.user.id, category.label);
        db.updateTicketChannel(`T-${formattedTicketNumber}`, channel.id);
    }

    async claimTicket(interaction) {
        if (!interaction.member.roles.cache.has(settings.supportRole)) {
            return interaction.reply({ content: '❌ ليس لديك صلاحية استلام التذاكر', flags: MessageFlags.Ephemeral });
        }

        const ticket = this.ticketData.get(interaction.channel.id);
        if (!ticket) return interaction.reply({ content: '❌ بيانات التذكرة غير موجودة', flags: MessageFlags.Ephemeral });
        if (ticket.claimedBy) return interaction.reply({ content: `❌ التذكرة مستلمة بالفعل بواسطة <@${ticket.claimedBy}>`, flags: MessageFlags.Ephemeral });

        ticket.claimedBy = interaction.user.id;
        ticket.claimedAt = new Date();
        this.ticketData.set(interaction.channel.id, ticket);
        this.persistTicketState();

        db.claimTicket(ticket.ticketId, interaction.user.id);

        const claimEmbed = new EmbedBuilder()
            .setTitle('تم استلام التذكرة 👋')
            .setDescription(`تم استلام التذكرة بواسطة ${interaction.user}`)
            .setColor(DEFAULT_TICKET_COLOR)
            .setTimestamp();

        await interaction.reply({ embeds: [claimEmbed] });
    }

    async unclaimTicket(interaction) {
        if (!interaction.member.roles.cache.has(settings.supportRole)) {
            return interaction.reply({ content: '❌ ليس لديك صلاحية إلغاء استلام التذاكر', flags: MessageFlags.Ephemeral });
        }

        const ticket = this.ticketData.get(interaction.channel.id);
        if (!ticket) return interaction.reply({ content: '❌ بيانات التذكرة غير موجودة', flags: MessageFlags.Ephemeral });

        if (ticket.claimedBy !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: `❌ لا يمكنك إلغاء استلام تذكرة مستلمة بواسطة شخص آخر`, flags: MessageFlags.Ephemeral });
        }

        ticket.claimedBy = null;
        ticket.claimedAt = null;
        this.ticketData.set(interaction.channel.id, ticket);
        this.persistTicketState();

        const claimEmbed = new EmbedBuilder()
            .setTitle('تم إلغاء الاستلام 🔄')
            .setDescription(`تم إلغاء استلام التذكرة بواسطة ${interaction.user}`)
            .setColor(DEFAULT_TICKET_COLOR)
            .setTimestamp();

        await interaction.reply({ embeds: [claimEmbed] });
    }

    async addUserPrompt(interaction) {
        if (!interaction.member.roles.cache.has(settings.supportRole)) {
            return interaction.reply({ content: '❌ ليس لديك صلاحية إضافة مستخدمين', flags: MessageFlags.Ephemeral });
        }

        const modal = new ModalBuilder()
            .setCustomId('add_user_modal')
            .setTitle('إضافة مستخدم للتذكرة');

        const userIdInput = new TextInputBuilder()
            .setCustomId('user_id')
            .setLabel("ايدي المستخدم (User ID)")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(userIdInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }

    async addUserToTicket(interaction) {
        const userId = interaction.fields.getTextInputValue('user_id');
        const user = await interaction.client.users.fetch(userId).catch(() => null);
        if (!user) return interaction.reply({ content: '❌ لم يتم العثور على هذا المستخدم', flags: MessageFlags.Ephemeral });

        await interaction.channel.permissionOverwrites.create(user.id, {
            ViewChannel: true,
            SendMessages: true,
            AttachFiles: true
        });

        await interaction.reply({ content: `✅ تم إضافة ${user} إلى التذكرة بواسطة ${interaction.user}` });
    }

    async saveTranscript(interaction) {
        if (!interaction.member.roles.cache.has(settings.supportRole)) {
            return interaction.reply({ content: '❌ ليس لديك صلاحية حفظ المحادثة', flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();
        const attachment = await discordTranscripts.createTranscript(interaction.channel, { limit: -1, fileName: `transcript-${interaction.channel.name}.html` });
        await interaction.editReply({ content: '✅ تم حفظ نسخة من المحادثة:', files: [attachment] });
    }

    async archiveTicket(interaction) {
        if (!interaction.member.roles.cache.has(settings.supportRole)) {
            return interaction.reply({ content: '❌ ليس لديك صلاحية أرشفة التذاكر', flags: MessageFlags.Ephemeral });
        }

        const ticket = this.ticketData.get(interaction.channel.id);
        if (!ticket) return interaction.reply({ content: '❌ بيانات التذكرة غير موجودة', flags: MessageFlags.Ephemeral });

        await interaction.reply({ content: '📦 جاري أرشفة التذكرة...' });

        const userPerms = ticket.userId;
        if (userPerms) {
            await interaction.channel.permissionOverwrites.edit(userPerms, { ViewChannel: false });
        }

        await interaction.channel.setName(`archived-${interaction.channel.name}`).catch(() => {});

        ticket.archived = true;
        this.ticketData.set(interaction.channel.id, ticket);
        this.persistTicketState();

        const archiveEmbed = new EmbedBuilder()
            .setTitle('تم أرشفة التذكرة 📦')
            .setDescription(`تمت أرشفة التذكرة وإخفائها عن العضو بواسطة ${interaction.user}`)
            .setColor(DEFAULT_TICKET_COLOR)
            .setTimestamp();

        await interaction.channel.send({ embeds: [archiveEmbed] });
    }

    async closeTicket(interaction) {
        const ticket = this.ticketData.get(interaction.channel.id);
        if (!ticket) return interaction.reply({ content: '❌ بيانات التذكرة غير موجودة', flags: MessageFlags.Ephemeral });

        await interaction.reply({ content: '🔒 جاري إغلاق التذكرة وحفظ النسخة...' });

        const attachment = await discordTranscripts.createTranscript(interaction.channel, { limit: -1, fileName: `transcript-${interaction.channel.name}.html` });
        const logChannel = interaction.guild.channels.cache.get(settings.logsChannelId);
        if (logChannel) await logChannel.send({ content: `نسخة التذكرة المغلية: ${interaction.channel.name}`, files: [attachment] });

        ticket.closed = true;
        ticket.closedAt = new Date();
        this.ticketData.set(interaction.channel.id, ticket);
        this.persistTicketState();

        db.closeTicket(ticket.ticketId);

        setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
}

export default new TicketManager();
