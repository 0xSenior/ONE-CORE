import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createTicketPanelMessage, DEFAULT_ACCENT_COLOR, DEFAULT_IMAGE_URL } from '../utils/ticketPanelComponents.js';

export default {
  data: new SlashCommandBuilder()
    .setName("setup-tickets")
    .setDescription("إعداد نظام التذاكر المتعدد الأقسام في القناة الحالية")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      // Check permissions
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return await interaction.reply({
          content: "❌ عذراً، أنت لا تملك صلاحيات **Administrator** لاستخدام هذا الأمر!",
          flags: 64 // EPHEMERAL
        });
      }

      const panelMessage = createTicketPanelMessage({
        description:
          "[ :flag_sa: ] اضغط على الزر أدناه لاختيار نوع التذكرة المناسب،\n" +
          "سيتم إنشاء تذكرة من البوت تحتوي على تفاصيل متابعة الطلب،\n\n" +
          "[ :flag_us: ] Select your ticket type from the Button below,\n" +
          "[ :flag_us: ] - Please follow the instructions.\n" +
          "[ :flag_sa: ] - .يرجى اتباع التعليمات المذكورة",
        color: DEFAULT_ACCENT_COLOR,
        imageUrl: DEFAULT_IMAGE_URL
      });

      await interaction.channel.send(panelMessage);

      await interaction.reply({
        content: "✅ **تم إعداد نظام التذاكر بنجاح في هذه القناة!**",
        flags: 64 // EPHEMERAL
      });

    } catch (error) {
      console.error("Error in setup-tickets command:", error);
      await interaction.reply({
        content: "❌ حدث خطأ أثناء إعداد نظام التذاكر.",
        flags: 64 // EPHEMERAL
      }).catch(() => {});
    }
  }
};
