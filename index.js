const {
    Client,
    EmbedBuilder,
    ActivityType,
    GatewayIntentBits,
    Partials,
    Collection
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Channel],
});

const config = require("./config.json");
client.login(config.token).catch(console.error);

const cooldown = new Collection();

client.on("ready", () => {
    console.log(`${client.user.tag} logged in!`);

    client.user.setActivity('Made By w.#1337', {
        type: ActivityType.Playing
    });
});

client.on("messageCreate", (message) => {
    if (message.content.startsWith(".mines")) {
        if (message.author.id !== "owner id") {
            let now = Date.now();

            if (cooldown.has(message.author.id)) {
                let expiration = cooldown.get(message.author.id) + 5000;

                if (now < expiration) {
                    let left = (expiration - now) / 1000;
                    return message.reply({
                        content: `Before using the command wait ${left.toFixed(1)} seconds.`
                    }).then(m => {
                        setTimeout(() => {
                            m.delete();
                        }, 3000);
                    });
                }
            }

            cooldown.set(message.author.id, now);
            setTimeout(() => cooldown.delete(message.author.id), 5000);
        }

        const filter = m => m.author.id === message.author.id;
        const collector = message.channel.createMessageCollector({ filter, max: 3, time: 30000 });

        const steps = [
            'Please enter the number of mines (1-24):',
            'Please enter the Active Client Seed:',
            'Please enter the Active Server Seed (Hashed):'
        ];

        let stepIndex = 0;
        message.channel.send(steps[stepIndex]);

        const userInputs = [];

        collector.on('collect', m => {
            userInputs.push(m.content);
            stepIndex++;
            if (stepIndex < steps.length) {
                message.channel.send(steps[stepIndex]);
            } else {
                collector.stop();
            }
        });

        collector.on('end', collected => {
            if (userInputs.length < steps.length) {
                message.channel.send('Command timed out or was incomplete.');
                return;
            }

            const numMines = parseInt(userInputs[0]);
            const clientSeed = userInputs[1];
            const serverSeed = userInputs[2];

            if (isNaN(numMines) || numMines < 1 || numMines > 24) {
                message.channel.send('Invalid number of mines. Please enter a number between 1 and 24.');
                return;
            }

            let embed = new EmbedBuilder();

            let list = Array(25).fill("❌");
            for (let i = 0; i < numMines; i++) {
                list[i] = "✅";
            }
            list = list.sort(() => 0.5 - Math.random());

            list.splice(5, 0, "\n");
            list.splice(11, 0, "\n");
            list.splice(17, 0, "\n");
            list.splice(23, 0, "\n");

            embed.setDescription(`**w. Predictions**`)
                .setThumbnail("https://cdn.discordapp.com/avatars/770526232646516737/5191eca55ff0cf4ccb80d383bcd72a0b.webp?size=80")
                .addFields(
                    { name: `**Prediction**`, value: "```" + list.join("") + "```" },
                    { name: `**Accuracy**`, value: "```" + Math.floor(Math.random() * 100) + "%```" },
                    { name: `**Active Client Seed**`, value: "```" + clientSeed + "```" },
                    { name: `**Active Server Seed (Hashed)**`, value: "```" + serverSeed + "```" }
                );

            message.channel.send({ embeds: [embed] });
        });
    }
});
