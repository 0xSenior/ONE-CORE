import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder
} from "discord.js";

const DEFAULT_ACCENT_COLOR = 0xff2f5b;
const DEFAULT_IMAGE_URL = "https://media.discordapp.net/attachments/1439986090164486144/1442599852344217763/ticket.png?ex=69352e8f&is=6933dd0f&hm=31d17386a5106d8ff114c045824dd4087aaa88dc3d1f9b3a23140851bbe87f0e&=&format=webp&quality=lossless&width=400&height=100";

function normalizeColor(color) {
  if (typeof color === "number" && Number.isInteger(color)) {
    return color;
  }

  if (typeof color !== "string") {
    return DEFAULT_ACCENT_COLOR;
  }

  const normalized = color.trim().replace(/^#/, "");
  if (!/^[\da-fA-F]{6}$/.test(normalized)) {
    return DEFAULT_ACCENT_COLOR;
  }

  return parseInt(normalized, 16);
}

export function createTicketPanelMessage({
  description,
  color,
  imageUrl = DEFAULT_IMAGE_URL,
  buttonLabel = "إنشاء تذكرة"
}) {
  const container = new ContainerBuilder().setAccentColor(normalizeColor(color));

  container
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(description)
    )
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder()
          .setURL(imageUrl)
          .setDescription("ONE Tickets banner")
      )
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("create_ticket")
          .setLabel(buttonLabel)
          .setEmoji("🎫")
          .setStyle(ButtonStyle.Primary)
      )
    );

  return {
    flags: MessageFlags.IsComponentsV2,
    components: [container]
  };
}

export { DEFAULT_ACCENT_COLOR, DEFAULT_IMAGE_URL };
