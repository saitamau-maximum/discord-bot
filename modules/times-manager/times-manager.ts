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
  ALUMNUS_ROLE,
  CHANNEL_TYPE_GUILD_CATEGORY,
} from "./constants";

export class TimesManager extends DiscordBotModule {
  name = "Times Manager";
  description = "Maximumのtimesチャンネルを管理するDiscord Botです。";
  version = "0.0.2";
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
      .setPlaceholder("`times-`以降のチャンネル名を入力してください")
      .setLabel(
        "チャンネル名 (例: maximumと入力するとtimes-maximumが作成されます)"
      )
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

        // ロールを取得
        const member = mInteraction.guild?.members.cache.get(
          mInteraction.user.id
        );
        if (!member) {
          await mInteraction.editReply({
            content: "ユーザーが見つかりませんでした。",
          });
          return;
        }

        // ロールをフィルタリングして取得
        const roles = member.roles.cache
          .filter((role) => {
            // 卒業生ロールと学年ロール「xxB」の形式を持つロールを取得
            return role.name === ALUMNUS_ROLE || role.name.match(/^[0-9]{2}B$/);
          })
          .map((role) => role.name);
        if (roles.length === 0) {
          await mInteraction.editReply({
            content: "学年ロールが見つかりませんでした。",
          });
          return;
        }

        // 降順でソートして「卒業生」ロールを優先させる
        roles.sort().reverse();

        // チャンネルのカテゴリーを取得
        const categoryName = "times-" + roles[0];
        const category = mInteraction.guild?.channels.cache.find(
          (c) => c.type === CHANNEL_TYPE_GUILD_CATEGORY && c.name === categoryName
        );
        if (!category) {
          await mInteraction.editReply({
            content:
              "カテゴリー名「" +
              categoryName +
              "」が見つかりませんでした。カテゴリーを作成する必要があります。",
          });
          return;
        }

        // チャンネル作成処理
        const guild = mInteraction.guild;
        if (!guild) return;
        const channel = await guild.channels.create({
          name: `times-${channelName}`,
          parent: category.id,
        });

        await mInteraction.editReply({
          content: `チャンネルを作成しました: ${channel}`,
        });

        await channel.send({
          content: `
**<@${mInteraction.user.id}> のTimesチャンネルを作成しました！**

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
