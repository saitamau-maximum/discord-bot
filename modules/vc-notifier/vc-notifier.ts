import {
  Client,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "discord.js";

import { DiscordBotModule } from "../generic";
import { isChannelTextBased } from "../utils";
import { NOTIFICATION_TEMPLATE } from "./template";
import {
  BASE_COMMANDS,
  NOTIFICATION_DISABLED_FROM,
  NOTIFICATION_DISABLED_TO,
  SUB_COMMANDS,
  SUB_COMMAND_DISABLE,
  SUB_COMMAND_ENABLE,
  SUB_COMMAND_HELP,
  SUB_COMMAND_INFO,
} from "./constants";
import { Env } from "../../main";

const isNotificationDisabled = () => {
  const now = new Date();
  const hour = now.getHours();
  return hour >= NOTIFICATION_DISABLED_FROM && hour < NOTIFICATION_DISABLED_TO;
};

export class VoiceChannelNotifier extends DiscordBotModule {
  private enabled = true;
  name = "VC通知めりん";
  description = "VCの参加/退出/移動を通知する";
  version = "1.3.0";
  author = "sor4chi";

  constructor(client: Client, env: Env) {
    super(client, env);
  }

  command() {
    const subCommands = Object.entries(SUB_COMMANDS).map(
      ([subCommand, description]) =>
        new SlashCommandSubcommandBuilder()
          .setName(subCommand)
          .setDescription(description)
    );

    const baseCommands = BASE_COMMANDS.map((baseCommand) =>
      new SlashCommandBuilder()
        .setName(baseCommand)
        .setDescription(this.description)
    );

    subCommands.forEach((subcommand) => {
      baseCommands.forEach((baseCommand) => {
        baseCommand.addSubcommand(subcommand);
      });
    });

    return baseCommands.map((baseCommand) => baseCommand.toJSON());
  }

  init() {
    this.client.on("voiceStateUpdate", (oldState, newState) => {
      if (!this.enabled || isNotificationDisabled()) return;

      const newUserChannel = newState.channel; // 新たに参加したチャンネル
      const oldUserChannel = oldState.channel; // 退出したチャンネル
      const notifyChannel = this.client.channels.cache.get(
        this.env.NOTIFY_CHANNEL_ID
      );

      // 新たにチャンネルに参加した場合
      if (oldUserChannel === null && newUserChannel !== null) {
        if (!isChannelTextBased(notifyChannel)) return;
        notifyChannel.send({
          embeds: [
            NOTIFICATION_TEMPLATE(
              "join",
              newState.member?.displayName,
              newUserChannel.name,
              newUserChannel.members.size,
              newState.member?.user.avatarURL()
            ),
          ],
        });
        return;
      }

      // チャンネルから退出した場合
      if (oldUserChannel !== null && newUserChannel === null) {
        if (!isChannelTextBased(notifyChannel)) return;
        notifyChannel.send({
          embeds: [
            NOTIFICATION_TEMPLATE(
              "leave",
              oldState.member?.displayName,
              oldUserChannel.name,
              oldUserChannel.members.size,
              oldState.member?.user.avatarURL()
            ),
          ],
        });
        return;
      }

      // チャンネルを移動した場合
      if (
        oldUserChannel !== null &&
        newUserChannel !== null &&
        oldUserChannel.id !== newUserChannel.id
      ) {
        if (!isChannelTextBased(notifyChannel)) return;
        notifyChannel.send({
          embeds: [
            NOTIFICATION_TEMPLATE(
              "move",
              newState.member?.displayName,
              newUserChannel.name,
              newUserChannel.members.size,
              newState.member?.user.avatarURL()
            ),
          ],
        });
        return;
      }
    });

    this.client.on("interactionCreate", (interaction) => {
      if (!interaction.isCommand()) return;
      if (!interaction.isChatInputCommand()) return;
      if (!BASE_COMMANDS.includes(interaction.commandName)) return;
      if (!interaction.inGuild()) return;

      const subCommand = interaction.options.getSubcommand();

      switch (subCommand) {
        case SUB_COMMAND_HELP:
          interaction.reply({
            content: this.help(),
          });
          break;
        case SUB_COMMAND_INFO:
          interaction.reply({
            content: this.info(),
          });
          break;
        case SUB_COMMAND_DISABLE:
          this.enabled = false;
          interaction.reply({
            content: "通知を無効化しました",
          });
          break;
        case SUB_COMMAND_ENABLE:
          this.enabled = true;
          interaction.reply({
            content: "通知を有効化しました",
          });
          break;
      }
    });
  }

  help() {
    return `
Base Commands: [ ${BASE_COMMANDS.map((baseCommand) => `/${baseCommand}`).join(
      ", "
    )} ]
Sub Commands:
${Object.entries(SUB_COMMANDS)
  .map(([subCommand, description]) => `${subCommand}: ${description}`)
  .join("\n")}
`.trim();
  }
}
