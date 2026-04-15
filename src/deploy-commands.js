import { REST, Routes } from 'discord.js';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands = [];

// Load all commands
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('📂 Loading commands for deployment...\n');

for (const file of commandFiles) {
    const filePath = join(commandsPath, file);
    const command = await import(pathToFileURL(filePath).href);

    if ('data' in command.default) {
        commands.push(command.default.data.toJSON());
        console.log(`   ✅ Loaded: ${command.default.data.name}`);
    }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Deploy commands function
export async function deployCommands() {
    try {
        console.log(`\n🚀 Started refreshing ${commands.length} application (/) commands.`);

        // For guild-based commands (faster for testing)
        if (process.env.GUILD_ID) {
            const data = await rest.put(
                Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                { body: commands }
            );
            console.log(`✅ Successfully reloaded ${data.length} guild commands.`);
        } else {
            // For global commands (takes up to 1 hour to propagate)
            const data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands }
            );
            console.log(`✅ Successfully reloaded ${data.length} global commands.`);
        }

        console.log('✨ Command deployment complete!\n');
    } catch (error) {
        console.error('❌ Error deploying commands:', error);
    }
}
