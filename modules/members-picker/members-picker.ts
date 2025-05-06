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
  SUB_COMMAND_MEMBERS,
  SUB_COMMAND_HELP,
  SUB_COMMAND_INFO,
  MEMBERS_COMMAND_DESC,
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

    // サブコマンド: members (従来の抽選処理)
    builder
      .addSubcommand((sub) => {
        sub
          .setName(SUB_COMMAND_MEMBERS)
          .setDescription(SUB_COMMANDS[SUB_COMMAND_MEMBERS]);

        // target オプションを OPTION_COUNT 個用意 (target1 は必須)
        for (let i = 1; i <= OPTION_COUNT; i++) {
          sub.addMentionableOption((option) => {
            option.setName(`${TARGET_PREFIX}${i}`);
            if (i === 1) {
              option
                .setDescription(MEMBERS_COMMAND_DESC[TARGET_PREFIX])
                .setRequired(true);
            } else {
              option.setDescription("追加の抽選対象 (任意)");
            }
            return option;
          });
        }

        sub.addIntegerOption((option) =>
          option
            .setName(SUB_COMMAND_COUNT)
            .setDescription(MEMBERS_COMMAND_DESC[SUB_COMMAND_COUNT])
        );

        // exclude オプションを OPTION_COUNT 個用意 (全て optional)
        for (let i = 1; i <= OPTION_COUNT; i++) {
          sub.addMentionableOption((option) => {
            option.setName(`${EXCLUDE_PREFIX}${i}`);
            if (i === 1) {
              option.setDescription(MEMBERS_COMMAND_DESC[EXCLUDE_PREFIX]);
            } else {
              option.setDescription("追加の除外対象 (任意)");
            }
            return option;
          });
        }
        return sub;
      })
      .addSubcommand((sub) =>
        sub
          .setName(SUB_COMMAND_HELP)
          .setDescription(SUB_COMMANDS[SUB_COMMAND_HELP])
      )
      .addSubcommand((sub) =>
        sub
          .setName(SUB_COMMAND_INFO)
          .setDescription(SUB_COMMANDS[SUB_COMMAND_INFO])
      );
    return [builder.toJSON()];
  }

  init() {
    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      if (interaction.commandName !== BASE_COMMAND) return;

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
        case SUB_COMMAND_MEMBERS: {
          // 複数の target, exclude オプションを取得
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
            await interaction.reply({
              content:
                "このコマンドは DM 等では使用できません。サーバー内で使用してください。",
            });
            return;
          }

          const eligibleMap = new Map<string, GuildMember>();
          for (const item of targets) {
            if (item instanceof Role) {
              item.members.forEach((member) =>
                eligibleMap.set(member.id, member)
              );
            } else {
              const member = interaction.guild.members.resolve(
                (item as GuildMember).id
              );
              if (member) eligibleMap.set(member.id, member);
            }
          }
          // Bot 自身を除外する
          if (this.client.user) {
            eligibleMap.delete(this.client.user.id);
          }

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
          for (const id of excludeIDs) {
            eligibleMap.delete(id);
          }

          if (eligibleMap.size < count) {
            await interaction.reply({
              content: "有効な対象人数が足りません。",
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
          break;
        }
        default: {
          await interaction.reply({
            content: "不明なサブコマンドです。",
          });
        }
      }
    });
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
