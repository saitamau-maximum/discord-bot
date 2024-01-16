import { Client, SlashCommandBuilder } from "discord.js";

import { DiscordBotModule } from "../generic";
import { Env } from "../../main";

import {
  BASE_COMMAND,
  DEGREE_LABELS,
  Degree,
  Grade,
  MEMBERS_API_ENDPOINT,
  Member,
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

          const parsedMembers = this.parseMembersApiResponse(members);

          await interaction.reply({
            content: this.renderMembers(parsedMembers),
            fetchReply: true,
          });

          break;
        }
      }
    });
  }

  parseMembersApiResponse(members: MembersApiResponse): Member[] {
    return members.map((member) => ({
      ...member,
      grade: member.grade.map(parseGrade),
    }));
  }

  sortMembers(members: Member[]) {
    const nameSortedMembers = members.sort((a, b) =>
      b.name.localeCompare(a.name)
    );
    const gradeSortedMembers = nameSortedMembers.sort((a, b) => {
      // Grade順にソート、最初の二文字が数字なのでパースして比較
      // 最大のGradeを持つ人が上に来るようにする
      const aMaxGrade = maxGrade(...a.grade);
      const bMaxGrade = maxGrade(...b.grade);
      return maxGrade(aMaxGrade, bMaxGrade) === aMaxGrade ? -1 : 1;
    });
    return gradeSortedMembers;
  }

  renderMembers(members: Member[]) {
    const [inActiveMembers, activeMembers] = members.reduce(
      ([inActiveMembers, activeMembers], member) =>
        member.isActive
          ? [inActiveMembers, [...activeMembers, member]]
          : [[...inActiveMembers, member], activeMembers],
      [[] as Member[], [] as Member[]]
    );

    const blocks: string[] = [];
    blocks.push(`
## Maximum Members Inspector
Maximumのメンバーの登録状況一覧です。
    `);

    if (activeMembers.length > 0) {
      blocks.push(`
### アクティブなメンバー :approved: (${activeMembers.length}人)
${this.sortMembers(activeMembers).map(this.renderMember).join("\n")}
    `);
    }

    if (inActiveMembers.length > 0) {
      blocks.push(`
### 非アクティブなメンバー :closed: (${inActiveMembers.length}人)
${this.sortMembers(inActiveMembers).map(this.renderMember).join("\n")}
    `);
    }

    if (blocks.length === 1) {
      blocks.push(`
**メンバーがまだ登録されていません。**
      `);
    }

    return blocks.join("\n");
  }

  renderMember(member: Member) {
    const grade = member.grade
      .map((grade) => `${grade.year}${DEGREE_LABELS[grade.degree]}`)
      .join(", ");
    return `- ${member.name} (${grade})`;
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

export const parseGrade = (grade: string): Grade => {
  const REGEX = /(\d+)([BMD])/;
  const match = grade.match(REGEX);
  if (!match) throw new Error("Invalid grade format");

  const year = parseInt(match[1]);
  const degree = match[2];

  switch (degree) {
    case "B":
      return { year, degree: Degree.Bachelor };
    case "M":
      return { year, degree: Degree.Master };
    case "D":
      return { year, degree: Degree.Doctor };
    default:
      throw new Error("Invalid grade format");
  }
};

export const maxGrade = (...grades: Grade[]) => {
  return grades.reduce((_maxGrade, grade) => {
    if (_maxGrade.degree < grade.degree) return grade;
    if (_maxGrade.degree > grade.degree) return _maxGrade;
    if (_maxGrade.year < grade.year) return _maxGrade;
    if (_maxGrade.year > grade.year) return grade;
    return _maxGrade;
  });
};
