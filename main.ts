import { Client } from "discord.js";
import { z } from "zod";
import * as modules from "./modules";

const envSchema = z.object({
  BOT_TOKEN: z.string(),
  NOTIFY_CHANNEL_ID: z.string(),
});

export type Env = z.infer<typeof envSchema>;

const env = envSchema.parse(process.env);
process.env.TZ = "Asia/Tokyo";

const client = new Client({
  intents: [
    "Guilds",
    "GuildVoiceStates",
    "GuildMessages",
    "GuildMembers",
    "MessageContent",
  ],
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

Object.values(modules).forEach((Module) => {
  new Module(client, env).init();
});

client.login(env.BOT_TOKEN);
