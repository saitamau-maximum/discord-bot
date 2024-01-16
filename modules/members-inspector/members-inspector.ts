import { Client, SlashCommandBuilder } from "discord.js";

import { DiscordBotModule } from "../generic";
import { Env } from "../../main";

import {
  BASE_COMMAND,
  MEMBERS_API_ENDPOINT,
  MembersApiResponse,
  SUB_COMMANDS,
  SUB_COMMAND_HELP,
  SUB_COMMAND_INFO,
  SUB_COMMAND_SHOW,
} from "./constants";

export class MembersInspector extends DiscordBotModule {
  name = "Maximum Members Inspector";
  description = "Maximumのメンバーの登録状況を確認することができます";
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
          .setName(SUB_COMMAND_SHOW)
          .setDescription(SUB_COMMANDS[SUB_COMMAND_SHOW])
      );

    return [baseCommands.toJSON()];
  }

  init() {
    this.client.on("interactionCreate", async (interaction) => {
      // コマンド以外は無視する
      if (!interaction.isChatInputCommand()) return;

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
        case SUB_COMMAND_SHOW: {
          const members = (await fetch(MEMBERS_API_ENDPOINT).then((res) =>
            res.json()
          )) as MembersApiResponse;

          await interaction.reply({
            content: this.renderMembers(members),
            fetchReply: true,
          });

          break;
        }
      }
    });
  }

  renderMembers(members: MembersApiResponse) {
    const gradeSortedMembers = members.sort((a, b) => {
      // Grade順にソート、最初の二文字が数字なのでパースして比較
      // 最大のGradeを持つ人が上に来るようにする
      const aMaxGrade = Math.max(
        ...a.grade.map((grade) => parseInt(grade.substring(0, 2)))
      );
      const bMaxGrade = Math.max(
        ...b.grade.map((grade) => parseInt(grade.substring(0, 2)))
      );
      return aMaxGrade - bMaxGrade;
    });
    // さらにそのあと非アクティブな人が下に来るようにする
    const isActiveSortedMembers = gradeSortedMembers.sort((a, b) =>
      a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1
    );

    const text = `
    ## Maximum Members Inspector
    Maximumのメンバーの登録状況一覧です。

    ${isActiveSortedMembers.map(this.renderMember).join("\n")}
    `.trim();

    return text;
  }

  renderMember(member: MembersApiResponse[0]) {
    const grade = member.grade.join(", ");
    const prefix = member.isActive ? ":approved:" : ":closed:";
    return `- ${prefix} ${member.name} (${grade})`;
  }

  help() {
    return `
Base Commands: [ ${BASE_COMMAND} ]
Sub Commands:
${Object.entries(SUB_COMMANDS)
  .map(([subCommand, description]) => `${subCommand}: ${description}`)
  .join("\n")}

:closed: :approved: はメンバーの登録状況を表します。
:closed: は非アクティブなメンバーです。
:approved: はアクティブなメンバーです。
`.trim();
  }
}
