const { EmbedBuilder, ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
const db = require('../managers/dbManager');

module.exports = {
  name: "user-tickets",
  description: "Show a user's ticket summary",
  default_member_permissions: PermissionFlagsBits.Administrator.toString(),
  options: [{
    name: "user",
    description: "The user to inspect",
    type: ApplicationCommandOptionType.User,
    required: true
  }],
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const user = interaction.options.getUser("user");
      
      // Get user's tickets from database
      const tickets = db.getAllTickets({ userId: user.id });
      
      if (tickets.length === 0) {
        return await interaction.editReply({ 
          content: `❌ No ticket records found for ${user}`
        });
      }
      
      const activeTickets = tickets.filter(ticket => ticket.status === 'open' && ticket.archived === 0);
      const closedTickets = tickets.filter(ticket => ticket.status === 'closed');
      const archivedTickets = tickets.filter(ticket => ticket.archived === 1);
      const claimedTickets = tickets.filter(ticket => ticket.claimed_by);
      const embed = new EmbedBuilder()
        .setTitle('📋 Ticket Summary')
        .setColor(0xff2f5b)
        .setDescription(`Summary for: ${user}`)
        .addFields(
          { name: 'Total Records', value: `<:1ONE_emoji_46:1438153723192016906> **-->** \`${tickets.length}\``, inline: true },
          { name: 'Open Tickets', value: `<:1ONE_emoji_46:1438153723192016906> **-->** \`${activeTickets.length}\``, inline: true },
          { name: 'Claimed Tickets', value: `<:1ONE_emoji_46:1438153723192016906> **-->** \`${claimedTickets.length}\``, inline: true },
          { name: 'Closed Tickets', value: `<:1ONE_emoji_46:1438153723192016906> **-->** \`${closedTickets.length}\``, inline: true },
          { name: 'Archived Tickets', value: `<:1ONE_emoji_46:1438153723192016906> **-->** \`${archivedTickets.length}\``, inline: true }
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
      console.error("Error fetching user tickets:", error);
      await interaction.editReply({ 
        content: "❌ An error occurred while fetching the ticket summary."
      });
    }
  }
};
