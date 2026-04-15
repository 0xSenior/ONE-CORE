import { createCanvas, loadImage } from '@napi-rs/canvas';
import { AttachmentBuilder } from 'discord.js';

export async function generateActionCard(title, user, fields, color = '#FFD700') {
    const width = 800;
    const height = 450;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // --- Background ---
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0f0f0f');
    bgGradient.addColorStop(1, '#1a1a1b');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Side accent color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 8, height);

    // Decorative glow
    const glow = ctx.createRadialGradient(80, 80, 0, 80, 80, 300);
    glow.addColorStop(0, hexToRgba(color, 0.15));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // --- Header ---
    ctx.textAlign = 'left';
    ctx.fillStyle = color;
    ctx.font = 'bold 30px CustomArial';
    ctx.fillText(title.toUpperCase(), 30, 50);

    // --- User Info (Target or Staff) ---
    // Avatar
    try {
        ctx.save();
        ctx.beginPath();
        ctx.arc(80, 130, 45, 0, Math.PI * 2);
        ctx.clip();
        const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
        ctx.drawImage(avatar, 35, 85, 90, 90);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(80, 130, 45, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    } catch (e) { }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px CustomArial';
    ctx.fillText(user.displayName || user.username, 145, 125);

    ctx.fillStyle = '#888888';
    ctx.font = '20px CustomArial';
    ctx.fillText(`ID: ${user.id}`, 145, 155);

    // --- Grid Fields ---
    const startX = 30;
    const startY = 220;
    const colWidth = 370;
    const rowHeight = 90;

    fields.forEach((field, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = startX + (col * colWidth);
        const y = startY + (row * rowHeight);

        // Field Background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        roundRect(ctx, x, y, colWidth - 20, 75, 10);
        ctx.fill();

        // Field Label
        ctx.fillStyle = '#888888';
        ctx.font = 'bold 14px CustomArial';
        ctx.fillText(field.name.toUpperCase(), x + 15, y + 25);

        // Field Value
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px CustomArial';
        // Truncate long values
        let val = field.value.toString();
        if (val.length > 30) val = val.substring(0, 27) + '...';
        ctx.fillText(val, x + 15, y + 55);
    });

    // --- Footer ---
    ctx.textAlign = 'right';
    ctx.fillStyle = '#444444';
    ctx.font = 'bold 15px CustomArial';
    ctx.fillText('ONE SYSTEM MANAGEMENT', width - 30, height - 20);

    return new AttachmentBuilder(await canvas.encode('png'), { name: 'action-card.png' });
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
