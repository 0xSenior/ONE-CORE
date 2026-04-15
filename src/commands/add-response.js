const {
  EmbedBuilder,
  ApplicationCommandOptionType,
  PermissionFlagsBits
} = require("discord.js");
const { QuickDB } = require("quick.db");
const db = new QuickDB(); // قاعدة بيانات بسيطة وسريعة

module.exports = {
  name: "add-response",
  description: "إضافة رد تلقائي جديد",
  default_member_permissions: PermissionFlagsBits.Administrator.toString(),
  options: [
    {
      name: "keyword",
      description: "الكلمة المفتاحية التي سيتم الرد عليها (دقيقة أو تحتوي)",
      type: ApplicationCommandOptionType.String,
      required: true
    },
    {
      name: "response",
      description: "الرد التلقائي الذي سيتم إرساله",
      type: ApplicationCommandOptionType.String,
      required: true
    },
    {
      name: "type",
      description: "نوع الرد: يحتوي على الكلمة أو مطابق تماماً",
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        { name: "يحتوي على الكلمة (Contains)", value: "contains" },
        { name: "مطابق تماماً (Exact)", value: "exact" }
      ]
    }
  ],

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const keyword = interaction.options.getString("keyword").toLowerCase().trim();
      const response = interaction.options.getString("response");
      const type = interaction.options.getString("type") || "contains"; // افتراضي: contains

      // منع الكلمات المكررة
      const existing = await db.get(`autoResponses_${interaction.guild.id}`) || [];

      const alreadyExists = existing.some(r => 
        r.keyword.toLowerCase() === keyword && r.type === type
      );

      if (alreadyExists) {
        return interaction.editReply({
          content: "⚠️ هذه الكلمة المفتاحية موجودة مسبقاً بنفس النوع!"
        });
      }

      // إضافة الرد الجديد
      await db.push(`autoResponses_${interaction.guild.id}`, {
        keyword,
        response,
        type,
        addedBy: interaction.user.id,
        addedAt: Date.now()
      });

      const embed = new EmbedBuilder()
        .setTitle("✅ تم إضافة رد تلقائي جديد بنجاح!")
        .addFields(
          { name: "الكلمة المفتاحية", value: `\`${keyword}\``, inline: true },
          { name: "نوع المطابقة", value: type === "exact" ? "مطابق تماماً" : "يحتوي على الكلمة", inline: true },
          { name: "الرد", value: response.length > 1000 ? response.substring(0, 1000) + "..." : response }
        )
        .setColor(0xff2f5b) // Updated color
        .setFooter({
          text: "ONE Support Team",
          iconURL: "https://cdn.discordapp.com/icons/1157764250899587168/a_70347d99d756911cc13387dd212fdda2.gif?animated=true&size=1024"
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("خطأ في أمر add-response:", error);
      await interaction.editReply({
        content: "❌ حدث خطأ أثناء إضافة الرد التلقائي!"
      }).catch(() => {});
    }
  }
};
