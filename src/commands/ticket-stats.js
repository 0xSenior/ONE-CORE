const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../managers/dbManager');

module.exports = {
  name: "ticket-stats",
  description: "عرض إحصائيات التذاكر",
  default_member_permissions: PermissionFlagsBits.Administrator.toString(),
  
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    try {
      // Get ticket statistics from database
      const stats = db.getTicketStats();
      
      const embed = new EmbedBuilder()
        .setTitle('📊 إحصائيات التذاكر')
        .setColor(0xff2f5b)
        .addFields(
          { name: 'إجمالي التذاكر', value: `${stats.total}`, inline: true },
          { name: 'التذاكر المفتوحة', value: `${stats.open}`, inline: true },
          { name: 'التذاكر المغلقة', value: `${stats.closed}`, inline: true },
          { name: 'التذاكر المؤرشفة', value: `${stats.archived}`, inline: true }
        )
        .setFooter({
          text: "ONE Support Team",
          iconURL: "https://cdn.discordapp.com/icons/1157764250899587168/a_70347d99d756911cc13387dd212fdda2.gif?animated=true&size=1024"
        })
        .setTimestamp();
      
      await interaction.editReply({ 
        embeds: [embed]
      });
    } catch (error) {
      console.error("Error fetching ticket stats:", error);
      await interaction.editReply({ 
        content: "❌ حدث خطأ أثناء جلب إحصائيات التذاكر."
      });
    }
  }
};
