import {
  ActionRowBuilder,
  Client,
  CommandInteraction,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

import { DiscordBotModule } from "../generic";
import { Env } from "../../main";

import {
  BASE_COMMAND,
  SUB_COMMANDS,
  SUB_COMMAND_HELP,
  SUB_COMMAND_INFO,
  SUB_COMMAND_CREATE,
  TIMES_CHANNEL_ID,
} from "./constants";

export class TimesManager extends DiscordBotModule {
  name = "Times Manager";
  description = "Maximumのtimesチャンネルを管理するDiscord Botです。";
  version = "0.0.1";
  author = "sor4chi";

  constructor(client: Client, env: Env) {
    super(client, env);
  }

  command() {
    const baseCommands = new SlashCommandBuilder()
      .setName(BASE_COMMAND)
      .setDescription(this.description)
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SUB_COMMAND_HELP)
          .setDescription(SUB_COMMANDS[SUB_COMMAND_HELP])
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SUB_COMMAND_INFO)
          .setDescription(SUB_COMMANDS[SUB_COMMAND_INFO])
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SUB_COMMAND_CREATE)
          .setDescription(SUB_COMMANDS[SUB_COMMAND_CREATE])
      );

    return [baseCommands.toJSON()];
  }

  init() {
    this.client.on("interactionCreate", async (interaction) => {
      // コマンド以外は無視する
      if (!interaction.isChatInputCommand()) return;
      if (BASE_COMMAND !== interaction.commandName) return;

      const subCommand = interaction.options.getSubcommand();

      switch (subCommand) {
        case SUB_COMMAND_HELP: {
          await interaction.reply({
            content: this.help(),
          });
          break;
        }
        case SUB_COMMAND_INFO: {
          await interaction.reply({
            content: this.info(),
          });
          break;
        }
        case SUB_COMMAND_CREATE: {
          this.createChannel(interaction);

          break;
        }
      }
    });
  }

  async createChannel(interaction: CommandInteraction) {
    const question = new TextInputBuilder()
      .setCustomId("times-channel-name")
      .setPlaceholder("チャンネル名を入力してください")
      .setLabel("チャンネル名 (例: maximum)")
      .setStyle(TextInputStyle.Short)
      .setMinLength(2)
      .setMaxLength(100)
      .setRequired(true);

    const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
      question
    );

    const modal = new ModalBuilder()
      .setCustomId("times-channel-create")
      .setTitle("Timesチャンネルを作成します");

    modal.addComponents(actionRow);

    await interaction.showModal(modal);

    interaction
      .awaitModalSubmit({
        filter: (m) => m.customId === "times-channel-create",
        time: 360000,
      })
      .then(async (mInteraction) => {
        const channelName =
          mInteraction.fields.getTextInputValue("times-channel-name");
        await mInteraction.reply({
          content: `チャンネル名: \`times-${channelName}\` でチャンネルを作成します`,
        });

        // チャンネル作成処理
        const guild = interaction.guild;
        if (!guild) return;
        const channel = await guild.channels.create({
          name: `times-${channelName}`,
          parent: TIMES_CHANNEL_ID,
        });

        await mInteraction.editReply({
          content: `チャンネルを作成しました: ${channel}`,
        });

        await channel.send({
          content: `
**<@${interaction.user.id}> のTimesチャンネルを作成しました！**

Timesチャンネルは、Twitterのタイムラインのように、自分の日々のできごとを共有したり、わからないことをみんなに質問したりなど、気軽にコミュニケーションを取るためのチャンネルです！
自分の好きなように使ってください！

※ もしチャンネルの作成ミスなどがあった場合は、運営（先輩）にお知らせください！
`.trim(),
        });
      })
      .catch(console.error);
  }

  help() {
    return `
Base Commands: [ ${BASE_COMMAND} ]
Sub Commands:
${Object.entries(SUB_COMMANDS)
  .map(([subCommand, description]) => `${subCommand}: ${description}`)
  .join("\n")}
`.trim();
  }
}
