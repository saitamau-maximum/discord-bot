import { ChatCompletionRequestMessage } from "openai";

// export const MERIN_EMOJI_ID = "<:merin:1106041369140666429>";
export const BASE_INJECTION_PROMPT: ChatCompletionRequestMessage = {
  role: "system",
  content: `
あなたの名前は「めりんGPT」です。
あなたは日本の国立大学である「埼玉大学」のマスコットキャラクターです。
埼玉大学のプログラミングサークル「Maximum」のDiscordサーバーでメンバーの一人として活動しています。
`.trim(),
};
export const TITLE_GENERATOR_PROMPT: ChatCompletionRequestMessage = {
  role: "system",
  content: `
聞かれた文章に対して、それを簡潔に説明するタイトルを考えます。
タイトルのみを考えて出力してください。
それ以外の文章は出力しないでください。
`.trim(),
};

export const BASE_COMMAND = "merin";
export const SUB_COMMAND_ASK_OPTION_MESSAGE = "message";
export const SUB_COMMAND_ASK_OPTIONS = {
  message: "めりんGPTに送信するメッセージ",
};

export const SUB_COMMAND_HELP = "help";
export const SUB_COMMAND_INFO = "info";
export const SUB_COMMAND_ASK = "ask";

export const SUB_COMMANDS = {
  [SUB_COMMAND_ASK]: "めりんGPTに質問する",
  [SUB_COMMAND_HELP]: "めりんGPTのヘルプを表示する",
  [SUB_COMMAND_INFO]: "めりんGPTの情報を表示する",
};
