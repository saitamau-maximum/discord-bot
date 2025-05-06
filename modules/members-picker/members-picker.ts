import { Client, SlashCommandBuilder, GuildMember, Role } from "discord.js";

import { DiscordBotModule } from "../generic";
import { Env } from "../../main";
import {
  BASE_COMMAND,
  SUB_COMMANDS,
  SUB_COMMAND_COUNT,
  TARGET_PREFIX,
  EXCLUDE_PREFIX,
  OPTION_COUNT,
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
      .setDescription(
        "対象 (ロール、ユーザー、@everyone 等) からランダムに指定人数を抽選する。"
      );

    // target オプションを OPTION_COUNT 個用意する (target1 のみ必須項目とする)
    for (let i = 1; i <= OPTION_COUNT; i++) {
      builder.addMentionableOption((option) =>
        option
          .setName(`${TARGET_PREFIX}${i}`)
          .setDescription(
            i === 1 ? SUB_COMMANDS[TARGET_PREFIX] : "追加の抽選対象 (任意)"
          )
          .setRequired(i === 1)
      );
    }

    builder.addIntegerOption((option) =>
      option
        .setName(SUB_COMMAND_COUNT)
        .setDescription(SUB_COMMANDS[SUB_COMMAND_COUNT])
    );

    // exclude オプションを OPTION_COUNT 個用意する (全て optional とする)
    for (let i = 1; i <= OPTION_COUNT; i++) {
      builder.addMentionableOption((option) =>
        option
          .setName(`${EXCLUDE_PREFIX}${i}`)
          .setDescription(
            i === 1 ? SUB_COMMANDS[EXCLUDE_PREFIX] : "追加の除外対象 (任意)"
          )
      );
    }

    return [builder.toJSON()];
  }

  init() {
    this.client.on("interactionCreate", async (interaction) => {
      // コマンド以外は無視する
      if (!interaction.isChatInputCommand()) return;
      if (BASE_COMMAND !== interaction.commandName) return;

      const targets = [];
      for (let i = 1; i <= OPTION_COUNT; i++) {
        const option = interaction.options.getMentionable(
          `${TARGET_PREFIX}${i}`
        );
        if (option) targets.push(option);
      }
      const count = interaction.options.getInteger(SUB_COMMAND_COUNT) || 1;
      const excludes = [];
      for (let i = 1; i <= OPTION_COUNT; i++) {
        const option = interaction.options.getMentionable(
          `${EXCLUDE_PREFIX}${i}`
        );
        if (option) excludes.push(option);
      }

      if (!interaction.guild) {
        await interaction.reply(
          "このコマンドは DM 等では使用できません。サーバー内で使用してください。"
        );
        return;
      }

      // 対象を有効なメンバーに変換する
      const eligibleMap = new Map<string, GuildMember>();
      for (const item of targets) {
        if (item instanceof Role) {
          item.members.forEach((member) => eligibleMap.set(member.id, member));
        } else {
          const member = interaction.guild.members.resolve(
            (item as GuildMember).id
          );
          if (member) eligibleMap.set(member.id, member);
        }
      }
      // Bot 自身を抽選対象から除外する
      if (this.client.user) {
        eligibleMap.delete(this.client.user.id);
      }

      // 除外対象のユーザー ID を収集
      const excludeIDs = new Set<string>();
      for (const item of excludes) {
        if (item instanceof Role) {
          item.members.forEach((member) => excludeIDs.add(member.id));
        } else {
          const member = interaction.guild.members.resolve(
            (item as GuildMember).id
          );
          if (member) excludeIDs.add(member.id);
        }
      }
      // 除外対象を eligibleMap から削除
      for (const id of excludeIDs) {
        eligibleMap.delete(id);
      }

      if (eligibleMap.size < count) {
        await interaction.reply("有効な対象人数が足りません。");
        return;
      }

      // eligibleMap からランダムに count 人選出するため、Fisher–Yates シャッフルをする
      const eligibleArr = Array.from(eligibleMap.values());
      for (let i = eligibleArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [eligibleArr[i], eligibleArr[j]] = [eligibleArr[j], eligibleArr[i]];
      }
      const selected = eligibleArr.slice(0, count);

      const selectedMentions = selected.map((m) => m.toString()).join(" ");
      await interaction.reply(`抽選結果: ${selectedMentions}`);
    });
  }

  help() {
    return `
Base Commands: [ ${BASE_COMMAND} ]
Sub Commands:
`.trim();
  }
}
