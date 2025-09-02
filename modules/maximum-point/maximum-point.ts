import {
  Client,
  CommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  MessageReaction,
  User,
  PartialMessageReaction,
  PartialUser,
} from "discord.js";

import { DiscordBotModule } from "../generic";
import { Env } from "../../main";
import { PointManager } from "./point-manager";

import {
  BASE_COMMAND,
  SUB_COMMANDS,
  SUB_COMMAND_RANKING,
  SUB_COMMAND_MY_POINTS,
  SUB_COMMAND_HELP,
  SUB_COMMAND_INFO,
} from "./constants";

export class MaximumPoint extends DiscordBotModule {
  name = "Maximum Point";
  description = "リアクションベースのポイント管理システム";
  version = "1.0.0";
  author = "Maximum Bot Team";
  private pointManager: PointManager;

  constructor(client: Client, env: Env) {
    super(client, env);
    this.pointManager = new PointManager();
  }

  command() {
    const baseCommands = new SlashCommandBuilder()
      .setName(BASE_COMMAND)
      .setDescription(this.description)
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SUB_COMMAND_RANKING)
          .setDescription(SUB_COMMANDS[SUB_COMMAND_RANKING])
          .addIntegerOption((option) =>
            option
              .setName("limit")
              .setDescription("表示する人数（デフォルト: 10）")
              .setRequired(false)
              .setMinValue(1)
              .setMaxValue(50)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SUB_COMMAND_MY_POINTS)
          .setDescription(SUB_COMMANDS[SUB_COMMAND_MY_POINTS])
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SUB_COMMAND_HELP)
          .setDescription(SUB_COMMANDS[SUB_COMMAND_HELP])
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName(SUB_COMMAND_INFO)
          .setDescription(SUB_COMMANDS[SUB_COMMAND_INFO])
      );

    return [baseCommands.toJSON()];
  }

  init() {
    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      if (BASE_COMMAND !== interaction.commandName) return;

      const subCommand = interaction.options.getSubcommand();

      switch (subCommand) {
        case SUB_COMMAND_RANKING: {
          await this.showRanking(interaction);
          break;
        }
        case SUB_COMMAND_MY_POINTS: {
          await this.showMyPoints(interaction);
          break;
        }
        case SUB_COMMAND_HELP: {
          await interaction.reply({
            content: this.help(),
            ephemeral: true,
          });
          break;
        }
        case SUB_COMMAND_INFO: {
          await interaction.reply({
            content: this.info(),
            ephemeral: true,
          });
          break;
        }
      }
    });

    this.client.on("messageReactionAdd", async (reaction, user) => {
      await this.handleReactionAdd(reaction, user);
    });

    this.client.on("messageReactionRemove", async (reaction, user) => {
      await this.handleReactionRemove(reaction, user);
    });
  }

  private async handleReactionAdd(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser
  ) {
    if (user.bot) return;

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error("Failed to fetch reaction:", error);
        return;
      }
    }

    const emoji = reaction.emoji.name || reaction.emoji.id || "";

    if (!this.pointManager.isTargetEmoji(emoji)) return;

    const targetUser = reaction.message.author;
    if (!targetUser || targetUser.bot) return;

    if (targetUser.id === user.id) return;

    this.pointManager.addPoint(
      targetUser.id,
      targetUser.username || targetUser.id,
      1
    );

    console.log(
      `Added 1 point to ${targetUser.username} (${targetUser.id}) by ${user.username}`
    );
  }

  private async handleReactionRemove(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser
  ) {
    if (user.bot) return;

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error("Failed to fetch reaction:", error);
        return;
      }
    }

    const emoji = reaction.emoji.name || reaction.emoji.id || "";

    if (!this.pointManager.isTargetEmoji(emoji)) return;

    const targetUser = reaction.message.author;
    if (!targetUser || targetUser.bot) return;

    if (targetUser.id === user.id) return;

    this.pointManager.removePoint(
      targetUser.id,
      targetUser.username || targetUser.id,
      1
    );

    console.log(
      `Removed 1 point from ${targetUser.username} (${targetUser.id}) by ${user.username}`
    );
  }

  private async showRanking(interaction: CommandInteraction) {
    const limit = (interaction.options.get("limit")?.value as number) || 10;
    const ranking = this.pointManager.getRanking(limit);

    if (ranking.length === 0) {
      await interaction.reply({
        content: "まだポイントが記録されていません。",
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("🏆 ポイントランキング")
      .setColor(0xffcc00)
      .setTimestamp()
      .setFooter({ text: `上位${limit}名` });

    const description = ranking
      .map((user, index) => {
        const medal =
          index === 0
            ? "🥇"
            : index === 1
            ? "🥈"
            : index === 2
            ? "🥉"
            : `${index + 1}.`;
        return `${medal} **${user.username}** - ${user.points}ポイント`;
      })
      .join("\n");

    embed.setDescription(description);

    await interaction.reply({ embeds: [embed] });
  }

  private async showMyPoints(interaction: CommandInteraction) {
    const userId = interaction.user.id;
    const points = this.pointManager.getPoints(userId);
    const ranking = this.pointManager.getRanking(100);
    const rank = ranking.findIndex((u) => u.userId === userId) + 1;

    const embed = new EmbedBuilder()
      .setTitle("📊 あなたのポイント")
      .setColor(0x00ff00)
      .setTimestamp()
      .addFields(
        { name: "ポイント", value: `${points}ポイント`, inline: true },
        {
          name: "順位",
          value: rank > 0 ? `${rank}位` : "ランキング外",
          inline: true,
        }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  help() {
    return `
**Maximum Point System**

Base Command: \`/${BASE_COMMAND}\`

**サブコマンド:**
${Object.entries(SUB_COMMANDS)
  .map(([cmd, desc]) => `• \`${cmd}\`: ${desc}`)
  .join("\n")}

**使い方:**
1. :maximum_point: の絵文字でリアクションすると、メッセージの投稿者に1ポイント付与
2. リアクションを外すと1ポイント減少
3. \`/point ranking\` でランキングを確認
4. \`/point mypoints\` で自分のポイントを確認

※自分のメッセージへのリアクションはカウントされません
`.trim();
  }
}
