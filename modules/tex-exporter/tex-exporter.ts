import {
  CacheType,
  Client,
  Interaction,
  Message,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from "discord.js";
import * as mj from "mathjax-node";
import { chromium } from "playwright";

import { DiscordBotModule } from "../generic";
import {
  BASE_COMMANDS,
  HEIGHT_ATTR_REGEX,
  SUB_COMMANDS,
  SUB_COMMAND_HELP,
  SUB_COMMAND_INFO,
  TEX_CODEBLOCK_REGEX,
  WIDTH_ATTR_REGEX,
} from "./constants";
import { Env } from "../../main";

mj.config({
  MathJax: {
    loader: {
      load: ["input/tex", "output/svg"],
    },
  },
});

export class TexExporter extends DiscordBotModule {
  name = "TexExporter";
  description = "Texで書かれたメッセージを画像にレンダリングして出力します";
  version = "1.0.0";
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

  async renderTexToImage(texCode: string) {
    const input = { math: texCode, format: "TeX", svg: true };
    const data = await mj.typeset(input);
    if (data.errors) throw new Error(data.errors);
    const svg = data.svg;

    const width = svg.match(WIDTH_ATTR_REGEX)[1];
    const height = svg.match(HEIGHT_ATTR_REGEX)[1];

    const scale = 2;
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setContent(
      svg
        .replace(WIDTH_ATTR_REGEX, `width="${scaledWidth}ex"`)
        .replace(HEIGHT_ATTR_REGEX, `height="${scaledHeight}ex"`)
    );
    const elementHandle = await page.$("svg");
    if (!elementHandle) throw new Error("svg element not found");
    const size = await elementHandle.boundingBox();
    if (!size) throw new Error("svg element size not found");
    await elementHandle.dispose();
    const buffer = await page.screenshot({ clip: { ...size } });
    await browser.close();
    return buffer;
  }

  async handleTexMessage(message: Message<boolean>) {
    const texCodeblockMatch = message.content.match(TEX_CODEBLOCK_REGEX);
    if (!texCodeblockMatch) return;

    message.channel.sendTyping();
    const interval = setInterval(() => {
      message.channel.sendTyping();
    }, 5000);

    try {
      const buffer = await this.renderTexToImage(texCodeblockMatch[1]);
      await message.channel.send({
        files: [
          {
            attachment: buffer,
            name: "tex.png",
          },
        ],
      });
    } catch (e) {
      await message.channel.send({
        content: `レンダリングに失敗しました\n\`\`\`\n${e.toString()}\n\`\`\``,
      });
    } finally {
      clearInterval(interval);
    }
  }

  handleInteraction(interaction: Interaction<CacheType>) {
    if (!interaction.isCommand()) return;
    if (!interaction.isChatInputCommand()) return;
    if (!BASE_COMMANDS.includes(interaction.commandName)) return;

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
    }
  }

  init() {
    this.client.on("messageCreate", this.handleTexMessage.bind(this));
    this.client.on("interactionCreate", this.handleInteraction.bind(this));
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
