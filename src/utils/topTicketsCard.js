const { AttachmentBuilder } = require('discord.js');

function roundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function drawAvatar(ctx, avatarURL, x, y, size) {
  const { loadImage } = require('@napi-rs/canvas');
  try {
    const avatar = await loadImage(avatarURL);
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, x, y, size, size);
    ctx.restore();
  } catch {
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

async function generateTopTicketsCard(users) {
  const { createCanvas } = require('@napi-rs/canvas');
  const width = 900;
  const height = Math.max(users.length * 110 + 180, 400);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#111111');
  bgGradient.addColorStop(1, '#232526');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  const glow = ctx.createRadialGradient(width / 2, 0, 0, width / 2, 0, 600);
  glow.addColorStop(0, 'rgba(255, 215, 0, 0.15)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 50px Arial';
  ctx.shadowColor = 'rgba(255, 215, 0, 0.45)';
  ctx.shadowBlur = 15;
  ctx.fillText('LEADERBOARD', width / 2, 80);

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#aaaaaa';
  ctx.font = '20px Arial';
  ctx.fillText('TOP ACTIVE STAFF MEMBERS', width / 2, 115);

  const startY = 160;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const y = startY + (i * 110);
    const rank = i + 1;

    ctx.beginPath();
    roundRect(ctx, 50, y, width - 100, 90, 15);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.fill();

    if (rank <= 3) {
      ctx.strokeStyle = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 10;
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.shadowBlur = 0;

    ctx.fillStyle = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : '#7289DA';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`#${rank}`, 100, y + 58);

    await drawAvatar(ctx, user.avatarURL, 145, y + 10, 70);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(user.username, 240, y + 40);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(Number(user.totalPoints || 0).toLocaleString(), width - 80, y + 40);

    ctx.fillStyle = '#888888';
    ctx.font = '16px Arial';
    ctx.fillText('POINTS', width - 80, y + 70);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#bbbbbb';
    ctx.font = '16px Arial';
    const details = `Rated: ${user.ratedTickets}  •  Avg: ${user.averageRating}  •  5 Stars: ${user.fiveStars}  •  Open: ${user.openClaims}`;
    ctx.fillText(details, 240, y + 70);
  }

  return new AttachmentBuilder(await canvas.encode('png'), { name: 'leaderboard.png' });
}

module.exports = {
  generateTopTicketsCard
};
