import { Events, ActivityType } from 'discord.js';

export default {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`\n🌟 Unified Bot Ready! Logged in as ${client.user.tag}`);
        console.log(`🌐 Server Count: ${client.guilds.cache.size}`);
        console.log(`👥 Total Users: ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)}`);

        // Update Bot Activity
        // client.user.setActivity({
        //     name: 'ONE Roleplay Manager',
        //     type: ActivityType.Watching
        // });

        console.log('\n✅ All systems online and operational!');
    },
};
