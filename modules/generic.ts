import {
  Client,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import { Env } from "../main";

export abstract class DiscordBotModule {
  /** DiscordBot client */
  client: Client;
  /** env(validated) */
  env: Env;
  /** DiscordBotModuleの名前 */
  abstract name: string;
  /** DiscordBotModuleの説明 */
  abstract description: string;
  /** DiscordBotModuleのバージョン */
  abstract version: string;
  /** DiscordBotModuleの作者 */
  abstract author: string;

  protected constructor(client: Client, env: Env) {
    this.client = client;
    this.env = env;
  }

  info() {
    return `
Name: ${this.name}
Description: ${this.description}
Version: ${this.version}
Author: ${this.author}
`.trim();
  }

  protected abstract command(): RESTPostAPIChatInputApplicationCommandsJSONBody[];
}
