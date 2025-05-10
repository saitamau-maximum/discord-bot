export const BASE_COMMAND = "pick";

export const OPTION_COUNT = 5;

export const TARGET_PREFIX = "target";
export const EXCLUDE_PREFIX = "exclude";

export const SUB_COMMAND_INFO = "info";
export const SUB_COMMAND_HELP = "help";
export const SUB_COMMAND_MEMBERS = "members";

export const SUB_COMMAND_COUNT_OPTION = "count";
export const SUB_COMMAND_BOT_OPTION = "bots";

export const SUB_COMMANDS = {
  [SUB_COMMAND_MEMBERS]: "メンバー抽選機を実行する",
  [SUB_COMMAND_HELP]: "Maximum Members Pickerのヘルプを表示する",
  [SUB_COMMAND_INFO]: "Maximum Members Pickerの情報を表示する",
};

export const MEMBERS_COMMAND_DESC = {
  [TARGET_PREFIX]: "抽選対象を指定する",
  [SUB_COMMAND_COUNT_OPTION]: "抽選人数 (デフォルト: 1)",
  [EXCLUDE_PREFIX]: "除外したいユーザーやロールを指定する",
  [SUB_COMMAND_BOT_OPTION]:
    "Bot を抽選対象に含めるかどうか (デフォルト: False)",
};
