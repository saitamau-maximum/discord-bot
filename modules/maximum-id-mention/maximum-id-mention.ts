import { Client } from "discord.js";
import { DiscordBotModule } from "../generic";
import { Env } from "../../main";
import { BASE_URL, DISPLAY_ID_PATTERN } from "./constants";

export class MaximumIdMention extends DiscordBotModule {
  name = "Maximum ID Mention";
  description = "m@display_id形式のメッセージをMaximum IDのURLに変換";
  version = "1.0.0";
  author = "Maximum";

  constructor(client: Client, env: Env) {
    super(client, env);
  }

  command() {
    return [];
  }

  init() {
    this.client.on("messageCreate", async (message) => {
      if (message.author.bot) return;

      const matches = message.content.match(DISPLAY_ID_PATTERN);

      if (!matches || matches.length === 0) return;

      const displayIds = matches.map((match) => {
        const displayId = match.replace("m@", "");
        return `${BASE_URL}/${displayId}`;
      });

      const uniqueUrls = [...new Set(displayIds)];

      await message.channel.send(uniqueUrls.join("\n"));
    });
  }
}
