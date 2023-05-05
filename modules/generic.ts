import { Client } from "discord.js";
import { Env } from "../main";

export interface DiscordBotCommand {
  /** command */
  command: string;
  /** description  (optional, discord markdown supported) */
  description?: string;
  /**
   * callback (optional)
   *
   * 引数がDynamicな場合はcallback内で処理する
   */
  callback?: () => void;
}

export class DiscordBotModule {
  /** DiscordBot client */
  client: Client;
  /** env(validated) */
  env: Env;
  /** DiscordBotModuleの名前 */
  name: string;
  /** DiscordBotModuleのcommand prefix一覧 */
  commandPrefixes: string[];
  /** DiscordBotModuleのcommand */
  commands: DiscordBotCommand[];
  /** DiscordBotModuleの説明 */
  description: string;
  /** DiscordBotModuleのバージョン */
  version: string;
  /** DiscordBotModuleの作者 */
  author: string;

  constructor(
    client: Client,
    env: Env,
    name: string,
    commandPrefixes: string[],
    commands: DiscordBotCommand[],
    description: string,
    version: string,
    author: string
  ) {
    this.client = client;
    this.env = env;
    this.name = name;
    this.commandPrefixes = commandPrefixes;
    this.commands = commands;
    this.description = description;
    this.version = version;
    this.author = author;
  }
}
