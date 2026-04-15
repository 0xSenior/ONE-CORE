import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { readdirSync, existsSync, createWriteStream, unlinkSync } from 'fs';
import https from 'https';
import dotenv from 'dotenv';
import { GlobalFonts } from '@napi-rs/canvas';

// Import All Systems and Managers
import { connectDatabase } from './database/connection.js';
import { deployCommands } from './deploy-commands.js';
import { VoiceTracker } from './systems/voiceTracker.js';
import { MessageTracker } from './systems/messageTracker.js';
import { ShiftSystem } from './systems/shiftSystem.js';
import { WeeklyLeaderboard } from './systems/weeklyLeaderboard.js';
import { SuggestionsSystem } from './systems/suggestionsSystem.js';
import ticketManager from './managers/ticketManager.js';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Discord client with all required intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

// Initialize command collection
client.commands = new Collection();

/**
 * Load all commands from the commands directory
 */
async function loadCommands() {
    const commandsPath = join(__dirname, 'commands');
    const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    console.log(`📂 Loading ${commandFiles.length} commands...`);

    for (const file of commandFiles) {
        const filePath = join(commandsPath, file);
        const command = await import(pathToFileURL(filePath).href);

        if ('data' in command.default && 'execute' in command.default) {
            client.commands.set(command.default.data.name, command.default);
            console.log(`   ✅ Loaded command: ${command.default.data.name}`);
        } else {
            console.log(`   ⚠️ Skipping ${file}: invalid command structure`);
        }
    }
}

/**
 * Load all events from the events directory
 */
async function loadEvents() {
    const eventsPath = join(__dirname, 'events');
    const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    console.log(`📂 Loading ${eventFiles.length} events...`);

    for (const file of eventFiles) {
        const filePath = join(eventsPath, file);
        const event = await import(pathToFileURL(filePath).href);

        if (event.default.once) {
            client.once(event.default.name, (...args) => event.default.execute(...args));
        } else {
            client.on(event.default.name, (...args) => event.default.execute(...args));
        }

        console.log(`   ✅ Loaded event: ${event.default.name}`);
    }
}

/**
 * Initialize all specialized tracking systems
 */
function initializeSystems() {
    console.log('🔧 Initializing tracking and management systems...');

    // Staff Tracking Systems
    client.voiceTracker = new VoiceTracker(client);
    client.messageTracker = new MessageTracker(client);
    client.shiftSystem = new ShiftSystem(client);
    client.weeklyLeaderboard = new WeeklyLeaderboard(client);
    console.log('   ✅ Staff Management Systems initialized');

    // Suggestions System
    client.suggestionsSystem = new SuggestionsSystem(client);
    console.log('   ✅ Suggestions System initialized');


    // Ticket Manager (singleton)
    client.ticketManager = ticketManager;
    console.log('   ✅ Ticket Management System initialized');
}

/**
 * Ensure font exists and is registered for image generation
 */
async function ensureFont() {
    const fontPath = join(__dirname, 'arial.ttf');
    if (existsSync(fontPath)) {
        GlobalFonts.registerFromPath(fontPath, 'CustomArial');
        console.log('🎨 Registered built-in font: CustomArial');
    }
}

/**
 * Main startup function
 */
async function main() {
    try {
        console.log('🚀 Starting Unified Bot...\n');

        await ensureFont();
        await connectDatabase();
        await loadCommands();
        await deployCommands();
        await loadEvents();
        
        initializeSystems();

        console.log('\n🔐 Logging in to Discord...');
        await client.login(process.env.DISCORD_TOKEN);

    } catch (error) {
        console.error('❌ Fatal error during startup:', error);
        process.exit(1);
    }
}

// Global Exception Handler
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled promise rejection:', error);
});

// Start the unified bot
main();
