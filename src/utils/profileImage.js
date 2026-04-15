import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { AttachmentBuilder } from 'discord.js';

export async function generateProfileCard(user, staff) {
    const width = 800;
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // --- Background ---
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#111111');
    bgGradient.addColorStop(1, '#232526');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative Element (Glow)
    const glow = ctx.createRadialGradient(width - 100, 50, 0, width - 100, 50, 400);
    glow.addColorStop(0, 'rgba(255, 215, 0, 0.1)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // --- Top Bar (Header) ---
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    roundRect(ctx, 20, 20, width - 40, 120, 15);
    ctx.fill();

    // Avatar
    try {
        ctx.save();
        ctx.beginPath();
        ctx.arc(80, 80, 45, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
        ctx.drawImage(avatar, 35, 35, 90, 90);
        ctx.restore();

        // Online Status Border (Gold for staff)
        ctx.beginPath();
        ctx.arc(80, 80, 45, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.stroke();
    } catch (e) {
        // Fallback
    }

    // Username & Tag
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px CustomArial';
    ctx.fillText(user.displayName, 145, 75);

    ctx.fillStyle = '#AAAAAA';
    ctx.font = '20px CustomArial';
    ctx.fillText(`@${user.username}`, 145, 105);

    // Total Points (Big Badge on right)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 45px CustomArial';
    ctx.fillText(staff.totalPoints.toLocaleString(), width - 50, 80);

    ctx.fillStyle = '#888888';
    ctx.font = 'bold 16px CustomArial';
    ctx.fillText('TOTAL POINTS', width - 50, 105);

    // --- Stats Grid ---
    const gridY = 170;

    // Helper to draw stat box
    function drawStatBox(x, y, title, value, icon, color) {
        // Box bg
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        roundRect(ctx, x, y, 240, 90, 10);
        ctx.fill();

        // Border bottom
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 90);
        ctx.lineTo(x + 230, y + 90);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Title
        ctx.textAlign = 'left';
        ctx.fillStyle = '#888888';
        ctx.font = '14px CustomArial';
        ctx.fillText(title, x + 15, y + 30);

        // Value
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px CustomArial';
        ctx.fillText(value.toLocaleString(), x + 15, y + 70);
    }

    // Row 1: Points Breakdown
    drawStatBox(20, gridY, 'BONUS POINTS', staff.adminPoints, '', '#3498db');
    drawStatBox(280, gridY, 'VOICE POINTS', staff.voicePoints, '', '#2ecc71');
    drawStatBox(540, gridY, 'MESSAGE POINTS', staff.messagePoints, '', '#e67e22');

    // Row 2: Statistics Details (Smaller)
    const statsY = gridY + 110;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; // Fixed typo: removed #
    roundRect(ctx, 20, statsY, 760, 80, 10);
    ctx.fill();

    ctx.textAlign = 'center';

    // Messages Count
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '14px CustomArial';
    ctx.fillText('MESSAGES SENT', 150, statsY + 30);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px CustomArial';
    ctx.fillText(staff.messageCount.toLocaleString(), 150, statsY + 60);

    // Separator
    ctx.fillStyle = '#333';
    ctx.fillRect(280, statsY + 15, 2, 50);

    // Words Count
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '14px CustomArial';
    ctx.fillText('WORDS TYPED', 400, statsY + 30);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px CustomArial';
    ctx.fillText(staff.wordCount.toLocaleString(), 400, statsY + 60);

    // Separator
    ctx.fillStyle = '#333';
    ctx.fillRect(530, statsY + 15, 2, 50);

    // Voice Time
    const hours = Math.floor(staff.voiceMinutes / 60);
    const mins = staff.voiceMinutes % 60;
    const timeStr = `${hours}h ${mins}m`;

    ctx.fillStyle = '#AAAAAA';
    ctx.font = '14px CustomArial';
    ctx.fillText('VOICE TIME', 650, statsY + 30);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px CustomArial';
    ctx.fillText(timeStr, 650, statsY + 60);

    return new AttachmentBuilder(await canvas.encode('png'), { name: 'profile-card.png' });
}

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
