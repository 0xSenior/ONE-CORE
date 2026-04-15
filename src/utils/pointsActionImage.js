import { createCanvas, loadImage } from '@napi-rs/canvas';
import { AttachmentBuilder } from 'discord.js';

export async function generatePointsActionCard(user, staff, options) {
    const { type, amount, pointType, typeNames } = options;
    const isAdd = type === 'add';
    
    // Config based on action type
    const color = isAdd ? '#2ecc71' : '#e74c3c'; // Green : Red
    const title = isAdd ? 'POINTS ADDED' : 'POINTS REMOVED';
    const symbol = isAdd ? '+' : '-';
    
    const width = 800;
    const height = 400; // Slightly shorter card
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // --- Background ---
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0f0f0f');
    bgGradient.addColorStop(1, '#1a1a1b');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Side accent
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 8, height);

    // Glow effect
    const glow = ctx.createRadialGradient(80, 80, 0, 80, 80, 300);
    glow.addColorStop(0, hexToRgba(color, 0.15));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // --- Header ---
    ctx.textAlign = 'left';
    ctx.fillStyle = color;
    ctx.font = 'bold 30px CustomArial';
    ctx.fillText(title, 30, 50);

    // --- User Info ---
    // Avatar
    try {
        ctx.save();
        ctx.beginPath();
        ctx.arc(80, 130, 45, 0, Math.PI * 2);
        ctx.clip();
        const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
        ctx.drawImage(avatar, 35, 85, 90, 90);
        ctx.restore();

        // Border
        ctx.beginPath();
        ctx.arc(80, 130, 45, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    } catch (e) { }

    // Name & ID
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px CustomArial';
    ctx.fillText(user.displayName || user.username, 145, 125);

    ctx.fillStyle = '#888888';
    ctx.font = '20px CustomArial';
    ctx.fillText(`ID: ${user.id}`, 145, 155);

    // --- Stats Box ---
    const startY = 220;
    
    // Box 1: Points Changed
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    roundRect(ctx, 30, startY, 350, 120, 10);
    ctx.fill();

    ctx.fillStyle = '#888888';
    ctx.font = 'bold 16px CustomArial';
    ctx.fillText(`${typeNames[pointType].toUpperCase()}`, 45, startY + 35);

    ctx.fillStyle = color;
    ctx.font = 'bold 40px CustomArial';
    ctx.fillText(`${symbol}${amount.toLocaleString()}`, 45, startY + 85);

    // Box 2: New Total
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    roundRect(ctx, 410, startY, 350, 120, 10);
    ctx.fill();

    ctx.fillStyle = '#888888';
    ctx.font = 'bold 16px CustomArial';
    ctx.fillText('NEW TOTAL BALANCE', 425, startY + 35);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 40px CustomArial';
    ctx.fillText(staff.totalPoints.toLocaleString(), 425, startY + 85);

    return new AttachmentBuilder(await canvas.encode('png'), { name: 'points-action.png' });
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
