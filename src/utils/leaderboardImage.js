import { createCanvas, loadImage } from '@napi-rs/canvas';
import { AttachmentBuilder } from 'discord.js';

export async function generateLeaderboard(users) {
    const width = 1400;
    const height = Math.max(users.length * 160 + 250, 600); // Dynamic height
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // --- Background ---
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#111111');
    bgGradient.addColorStop(1, '#232526');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative glow at top
    const glow = ctx.createRadialGradient(width / 2, 0, 0, width / 2, 0, 600);
    glow.addColorStop(0, 'rgba(255, 215, 0, 0.15)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // --- Header ---
    ctx.textAlign = 'center';

    // Main Title
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 70px CustomArial';
    ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
    ctx.shadowBlur = 15;
    ctx.fillText('LEADERBOARD', width / 2, 110);

    // Subtitle
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '28px CustomArial';
    ctx.fillText('TOP ACTIVE STAFF MEMBERS', width / 2, 155);

    // --- Draw Users ---
    const startY = 230;

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const y = startY + (i * 160);
        const rank = i + 1;

        // Card Styling
        ctx.beginPath();
        roundRect(ctx, 80, y, width - 160, 140, 20);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fill();

        // Border for top 3
        if (rank <= 3) {
            ctx.strokeStyle = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Glow for top 3
            ctx.shadowColor = ctx.strokeStyle;
            ctx.shadowBlur = 10;
        } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        ctx.shadowBlur = 0; // Reset shadow

        // Rank Number
        ctx.fillStyle = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : '#7289DA';
        ctx.font = 'bold 50px CustomArial';
        ctx.textAlign = 'center';
        ctx.fillText(`#${rank}`, 150, y + 85);

        // Avatar
        try {
            ctx.save();
            ctx.beginPath();
            ctx.arc(270, y + 70, 50, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            const avatar = await loadImage(user.avatarURL);
            ctx.drawImage(avatar, 220, y + 20, 100, 100);
            ctx.restore();
        } catch (e) {
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.arc(270, y + 70, 50, 0, Math.PI * 2);
            ctx.fill();
        }

        // Username
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 40px CustomArial';
        ctx.fillText(user.username, 350, y + 60);

        // Total Points Badge
        ctx.textAlign = 'right';
        ctx.fillStyle = '#FFD700'; // Gold color for points
        ctx.font = 'bold 48px CustomArial';
        ctx.fillText(user.totalPoints.toLocaleString(), width - 120, y + 60);

        ctx.fillStyle = '#888888';
        ctx.font = '22px CustomArial';
        ctx.fillText('POINTS', width - 120, y + 105);

        // Detailed Stats (Small text below username)
        ctx.textAlign = 'left';
        ctx.fillStyle = '#bbbbbb';
        ctx.font = '22px CustomArial';
        const details = `Bonus: ${user.adminPoints}  •  Voice: ${user.voicePoints}  •  Msg: ${user.messagePoints}`;
        ctx.fillText(details, 350, y + 105);
    }

    return new AttachmentBuilder(await canvas.encode('png'), { name: 'leaderboard.png' });
}

// Helper function for rounded rectangles
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
