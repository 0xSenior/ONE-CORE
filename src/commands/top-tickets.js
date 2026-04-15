const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../managers/dbManager');

module.exports = {
  name: "top-tickets",
  description: "عرض أفضل الإداريين في التذاكر",
  default_member_permissions: PermissionFlagsBits.Administrator.toString(),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const topAdmins = db.getTopTicketAdmins(10);
      const openClaims = db.getAdminOpenClaims();
      const openClaimsMap = new Map(openClaims.map(row => [row.admin_id, row.open_claims]));

      if (topAdmins.length === 0) {
        return await interaction.editReply({
          content: '❌ لا توجد بيانات تقييمات كافية لعرض الترتيب.'
        });
      }

      const rows = await Promise.all(topAdmins.map(async (admin) => {
        const member = await interaction.guild.members.fetch(admin.admin_id).catch(() => null);
        return {
          username: member?.displayName || member?.user?.username || admin.admin_id,
          avatarURL: member?.displayAvatarURL({ extension: 'png', size: 256 }) || member?.user?.displayAvatarURL?.({ extension: 'png', size: 256 }) || 'https://cdn.discordapp.com/embed/avatars/0.png',
          totalPoints: admin.rated_tickets,
          ratedTickets: admin.rated_tickets,
          averageRating: admin.average_rating || 0,
          fiveStars: admin.five_star_count || 0,
          openClaims: openClaimsMap.get(admin.admin_id) || 0
        };
      }));

      try {
        const { generateTopTicketsCard } = require('../utils/topTicketsCard');
        const attachment = await generateTopTicketsCard(rows);

        await interaction.editReply({
          files: [attachment]
        });
      } catch (canvasError) {
        const reason = canvasError?.code === 'MODULE_NOT_FOUND'
          ? 'Canvas dependency is not installed on this host.'
          : (canvasError?.message || 'Unknown canvas error.');
        console.warn(`Canvas renderer unavailable, falling back to embed: ${reason}`);

        const embed = new EmbedBuilder()
          .setTitle('🏆 Top Tickets')
          .setColor(0xff2f5b)
          .setDescription('Canvas renderer is unavailable on this host. Showing fallback ranking.')
          .addFields(
            rows.slice(0, 10).map((row, index) => ({
              name: `#${index + 1} - ${row.username}`,
              value:
                `Rated Tickets: \`${row.ratedTickets}\`\n` +
                `Average Rating: \`${row.averageRating}\`\n` +
                `5 Stars: \`${row.fiveStars}\`\n` +
                `Open Claims: \`${row.openClaims}\``,
              inline: false
            }))
          )
          .setFooter({
            text: 'ONE Support Team'
          })
          .setTimestamp();

        await interaction.editReply({
          embeds: [embed]
        });
      }
    } catch (error) {
      console.error('Error fetching top tickets:', error);
      await interaction.editReply({
        content: '❌ حدث خطأ أثناء جلب ترتيب الإداريين.'
      });
    }
  }
};
