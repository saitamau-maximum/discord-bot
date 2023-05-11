import { Client, Collection, Message, SlashCommandBuilder } from "discord.js";

import { DiscordBotModule } from "../generic";
import { Env } from "../../main";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";
import {
  BASE_COMMAND,
  BASE_INJECTION_PROMPT,
  SUB_COMMANDS,
  SUB_COMMAND_ASK,
  SUB_COMMAND_ASK_OPTIONS,
  SUB_COMMAND_ASK_OPTION_MESSAGE,
  SUB_COMMAND_HELP,
  SUB_COMMAND_INFO,
  TITLE_GENERATOR_PROMPT,
} from "./constants";
import { ThreadChannel } from "discord.js";

export class MerinGPT extends DiscordBotModule {
  name = "めりんGPT";
  description = "Chat GPT APIを利用した対話型ChatBot";
  version = "1.0.0";
  author = "sor4chi";
  private openai: OpenAIApi;
  private GPT_MODEL = "gpt-3.5-turbo";

  constructor(client: Client, env: Env) {
    super(client, env);
    const opanAIConfig = new Configuration({
      apiKey: env.OPENAI_API_KEY,
    });
    this.openai = new OpenAIApi(opanAIConfig);
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
          .setName(SUB_COMMAND_ASK)
          .setDescription(SUB_COMMANDS[SUB_COMMAND_ASK])
          .addStringOption((option) =>
            option
              .setName(SUB_COMMAND_ASK_OPTION_MESSAGE)
              .setDescription(
                SUB_COMMAND_ASK_OPTIONS[SUB_COMMAND_ASK_OPTION_MESSAGE]
              )
              .setRequired(true)
          )
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
        case SUB_COMMAND_ASK: {
          const message = interaction.options.getString(
            SUB_COMMAND_ASK_OPTION_MESSAGE
          );
          if (!message) return;

          const reply = await interaction.reply({
            content: `
  ${interaction.user.username}:
  ${message}
  `.trim(),
            fetchReply: true,
          });

          const [title, answer] = await Promise.all([
            this.summarizeTitleFromText(message),
            this.askMerin(message),
          ]);

          const thread = await reply.startThread({
            name: title,
            autoArchiveDuration: 60,
          });

          await thread.send(answer);
          break;
        }
      }
    });

    this.client.on("messageCreate", async (message) => {
      if (!message.channel.isThread()) return;
      if (message.author.bot) return;
      if (this.isMerinMessage(message)) return;

      const thread = message.channel;
      const history = await thread.messages.fetch();

      // スレッドの作成者がメリンでない場合は無視する
      if (!this.isMerinThread(thread)) return;
      const prompt = this.getPromptFromHistory(history);
      const answer = await this.fetchCompletion(prompt);
      await thread.send(answer);
    });
  }

  isMerinMessage(message: Message) {
    return message.author.id === this.client.user?.id;
  }

  isMerinThread(thread: ThreadChannel) {
    return thread.ownerId === this.client.user?.id;
  }

  getPromptFromHistory(history: Collection<string, Message>) {
    const historyMessages: ChatCompletionRequestMessage[] = history.map(
      (message) => ({
        role: this.isMerinMessage(message) ? "assistant" : "user",
        content: message.content,
      })
    );

    return [BASE_INJECTION_PROMPT, ...historyMessages];
  }

  async fetchCompletion(prompt: ChatCompletionRequestMessage[]) {
    try {
      const completion = await this.openai.createChatCompletion({
        model: this.GPT_MODEL,
        messages: prompt,
      });

      const answer = completion.data.choices[0].message;
      if (!answer) throw new Error("解答が空でした");
      return answer.content;
    } catch (error) {
      console.error(error);
      return "エラーが発生しました";
    }
  }

  async summarizeTitleFromText(text: string) {
    const prompt: ChatCompletionRequestMessage[] = [
      BASE_INJECTION_PROMPT,
      TITLE_GENERATOR_PROMPT,
      {
        role: "user",
        content: text,
      },
    ];

    const answer = await this.fetchCompletion(prompt);
    return answer;
  }

  async askMerin(message: string) {
    const prompt: ChatCompletionRequestMessage[] = [
      BASE_INJECTION_PROMPT,
      {
        role: "user",
        content: message,
      },
    ];

    const answer = await this.fetchCompletion(prompt);
    return answer;
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
