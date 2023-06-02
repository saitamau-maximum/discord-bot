export const BASE_COMMANDS = ["tex-exporter"];

export const SUB_COMMAND_HELP = "help";
export const SUB_COMMAND_INFO = "info";

export const SUB_COMMANDS = {
  [SUB_COMMAND_HELP]: "TexExporterのヘルプを表示する",
  [SUB_COMMAND_INFO]: "TexExporterの情報を表示する",
};

export const TEX_CODEBLOCK_REGEX = /```tex\n(.+?)\n```/sg;
export const WIDTH_ATTR_REGEX = /width="([\d\.]+)ex"/;
export const HEIGHT_ATTR_REGEX = /height="([\d\.]+)ex"/;
