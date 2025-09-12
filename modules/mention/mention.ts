import { Client } from "discord.js";
import { DiscordBotModule } from "../generic";
import { Env } from "../../main";
import {
  MAXIMUM_USER_URL,
  GITHUB_USER_URL,
  X_USER_URL,
  MAXIMUM_DISPLAY_ID_PATTERN,
  GITHUB_ID_PATTERN,
  X_ID_PATTERN,
} from "./constants";

export const matchWithIds = (content: string, pattern: RegExp): string[] => {
  const matches = content
    .split(/[\s\n]+/)
    .map((line) => line.trim())
    .map((line) => Array.from(line.matchAll(pattern)))
    .flat();
  if (matches.length > 0) return matches.map((match) => match[1]);
  return [];
};

export class Mention extends DiscordBotModule {
  name = "Mention";
  description =
    "いろいろなパターンのメンションを検知し、URLに変換して返信します";
  version = "1.0.0";
  author = "Sor4chi";

  constructor(client: Client, env: Env) {
    super(client, env);
  }

  command() {
    return [];
  }

  init() {
    this.client.on("messageCreate", async (message) => {
      if (message.author.bot) return;
      console.log(message.content);

      const maximumDisplayIds = matchWithIds(
        message.content,
        MAXIMUM_DISPLAY_ID_PATTERN
      );
      const githubIds = matchWithIds(message.content, GITHUB_ID_PATTERN);
      const xIds = matchWithIds(message.content, X_ID_PATTERN);

      const uniqueUrls = [
        ...new Set([
          ...maximumDisplayIds.map((id) => MAXIMUM_USER_URL(id)),
          ...githubIds.map((id) => GITHUB_USER_URL(id)),
          ...xIds.map((id) => X_USER_URL(id)),
        ]),
      ];

      const content = uniqueUrls.join("\n");
      if (content === "") return;
      await message.reply(content);
    });
  }
}
