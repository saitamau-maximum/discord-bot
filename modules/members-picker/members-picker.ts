import {
  Client,
  SlashCommandBuilder,
  GuildMember,
  Role,
  ChatInputCommandInteraction,
  SlashCommandSubcommandBuilder,
} from "discord.js";

import { DiscordBotModule } from "../generic";
import { Env } from "../../main";
import {
  BASE_COMMAND,
  SUB_COMMANDS,
  SUB_COMMAND_COUNT_OPTION,
  TARGET_PREFIX,
  EXCLUDE_PREFIX,
  OPTION_COUNT,
  SUB_COMMAND_MEMBERS,
  SUB_COMMAND_HELP,
  SUB_COMMAND_INFO,
  MEMBERS_COMMAND_DESC,
  SUB_COMMAND_BOT_OPTION,
} from "./constants";

export class MembersPicker extends DiscordBotModule {
  name = "メンバー抽選機";
  description = "サーバーメンバーから条件付きで何人かを抽選します";
  version = "1.0.0";
  author = "yukikamome316";

  constructor(client: Client, env: Env) {
    super(client, env);
  }

  command() {
    const builder = new SlashCommandBuilder()
      .setName(BASE_COMMAND)
      .setDescription("抽選関連コマンド");

    builder.addSubcommand((sub) => this.buildMembersSubcommand(sub));
    builder.addSubcommand((sub) =>
      sub
        .setName(SUB_COMMAND_HELP)
        .setDescription(SUB_COMMANDS[SUB_COMMAND_HELP])
    );
    builder.addSubcommand((sub) =>
      sub
        .setName(SUB_COMMAND_INFO)
        .setDescription(SUB_COMMANDS[SUB_COMMAND_INFO])
    );

    return [builder.toJSON()];
  }

  private buildMembersSubcommand(sub: SlashCommandSubcommandBuilder): any {
    sub
      .setName(SUB_COMMAND_MEMBERS)
      .setDescription(SUB_COMMANDS[SUB_COMMAND_MEMBERS]);

    // target オプションを OPTION_COUNT 個用意 (target1 は必須)
    for (let i = 1; i <= OPTION_COUNT; i++) {
      sub.addMentionableOption(
        (option) =>
          option
            .setName(`${TARGET_PREFIX}${i}`)
            .setDescription(MEMBERS_COMMAND_DESC[TARGET_PREFIX])
            .setRequired(i === 1) // 1 番目の選択肢だけ必須とする
      );
    }

    sub.addIntegerOption((option) =>
      option
        .setName(SUB_COMMAND_COUNT_OPTION)
        .setDescription(MEMBERS_COMMAND_DESC[SUB_COMMAND_COUNT_OPTION])
    );

    // exclude オプションを OPTION_COUNT 個用意 (全て optional)
    for (let i = 1; i <= OPTION_COUNT; i++) {
      sub.addMentionableOption((option) =>
        option
          .setName(`${EXCLUDE_PREFIX}${i}`)
          .setDescription(MEMBERS_COMMAND_DESC[EXCLUDE_PREFIX])
      );
    }

    sub.addBooleanOption((option) =>
      option
        .setName(SUB_COMMAND_BOT_OPTION)
        .setDescription(MEMBERS_COMMAND_DESC[SUB_COMMAND_BOT_OPTION])
    );
    return sub;
  }

  init() {
    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      if (interaction.commandName !== BASE_COMMAND) return;

      const subCommand = interaction.options.getSubcommand();
      switch (subCommand) {
        case SUB_COMMAND_HELP:
          await this.handleHelp(interaction);
          break;
        case SUB_COMMAND_INFO:
          await this.handleInfo(interaction);
          break;
        case SUB_COMMAND_MEMBERS:
          await this.handleMembersCommand(interaction);
          break;
        default:
          await interaction.reply({
            content: "不明なサブコマンドです。",
            ephemeral: true,
          });
      }
    });
  }

  private async handleHelp(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
      content: this.help(),
    });
  }

  private async handleInfo(interaction: ChatInputCommandInteraction) {
    await interaction.reply({
      content: this.info(),
    });
  }

  private async handleMembersCommand(interaction: ChatInputCommandInteraction) {
    const targets = this.getMentionableOptions(interaction, TARGET_PREFIX);
    const count = interaction.options.getInteger(SUB_COMMAND_COUNT_OPTION) || 1;
    const excludes = this.getMentionableOptions(interaction, EXCLUDE_PREFIX);
    const shouldIncludeBots =
      interaction.options.getBoolean(SUB_COMMAND_BOT_OPTION) || false;

    if (!interaction.guild) {
      await interaction.reply({
        content:
          "このコマンドは DM 等では使用できません。サーバー内で使用してください。",
      });
      return;
    }

    await interaction.guild.members.fetch();

    const eligibleMap = new Map<string, GuildMember>();
    for (const target of targets) {
      if (target instanceof Role) {
        for (const member of target.members.values()) {
          eligibleMap.set(member.id, member);
        }
      } else {
        eligibleMap.set(target.id, target);
      }
    }

    // Bot 自身を除外
    if (this.client.user) {
      eligibleMap.delete(this.client.user.id);
    }

    // コマンドに応じて Bot を全て除外する
    if (!shouldIncludeBots) {
      for (const [id, member] of eligibleMap) {
        if (member.user.bot) {
          eligibleMap.delete(id);
        }
      }
    }

    // 除外対象ユーザーの ID を集計する
    const exclusionSet = new Set<string>();
    for (const item of excludes) {
      if (item instanceof Role) {
        for (const member of item.members.values()) {
          exclusionSet.add(member.id);
        }
      } else {
        exclusionSet.add(item.id);
      }
    }

    // 除外対象と eligibleMap の差集合を計算
    for (const id of exclusionSet) {
      eligibleMap.delete(id);
    }

    if (eligibleMap.size < count) {
      await interaction.reply({
        content:
          "指定された条件で抽選対象となるユーザーが、抽選しようとしている人数よりも少ないため抽選できませんでした。",
        ephemeral: true,
      });
      return;
    }

    // Fisher-Yates shuffle
    const eligibleArr = Array.from(eligibleMap.values());
    for (let i = eligibleArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [eligibleArr[i], eligibleArr[j]] = [eligibleArr[j], eligibleArr[i]];
    }

    const selected = eligibleArr.slice(0, count);
    const selectedMentions = selected.map((m) => m.toString()).join(" ");
    await interaction.reply({
      content: `抽選結果: ${selectedMentions}`,
    });
  }

  private getMentionableOptions(
    interaction: ChatInputCommandInteraction,
    prefix: string
  ): (GuildMember | Role)[] {
    const results: (GuildMember | Role)[] = [];
    for (let i = 1; i <= OPTION_COUNT; i++) {
      const option = interaction.options.getMentionable(`${prefix}${i}`);
      if (option && option instanceof Role) {
        results.push(option);
      } else if (option) {
        // 基本的に Role or GuildMember しか選択されないため
        results.push(option as GuildMember);
      }
    }
    return results;
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
