import { createCanvas } from '@napi-rs/canvas';
import { AttachmentBuilder } from 'discord.js';

export async function generateShiftPanel() {
    const width = 800;
    const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#101010');
    bgGradient.addColorStop(1, '#181818');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Side Accent
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, 0, 10, height);

    // Glow
    const glow = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, 400);
    glow.addColorStop(0, 'rgba(255, 215, 0, 0.05)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 45px CustomArial';
    ctx.fillText('ONE SYSTEM STAFF', width / 2, 110);

    // Subtitle
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 25px CustomArial';
    ctx.letterSpacing = 2; // Approximate tracking if supported, otherwise ignored
    ctx.fillText('SHIFT MANAGEMENT PANEL', width / 2, 150);

    // Instructions
    ctx.fillStyle = '#888888';
    ctx.font = '18px CustomArial';
    ctx.fillText('Click below to manage your active shift status', width / 2, 220);

    return new AttachmentBuilder(await canvas.encode('png'), { name: 'shift-panel.png' });
}
