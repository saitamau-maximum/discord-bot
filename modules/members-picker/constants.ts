export const BASE_COMMAND = "pick";

export const OPTION_COUNT = 3;

export const TARGET_PREFIX = "target";
export const EXCLUDE_PREFIX = "exclude";

export const SUB_COMMAND_INFO = "info";
export const SUB_COMMAND_HELP = "help";
export const SUB_COMMAND_MEMBERS = "members";
export const SUB_COMMAND_COUNT = "count";

export const SUB_COMMANDS = {
  [SUB_COMMAND_MEMBERS]: "メンバー抽選機を実行する",
  [SUB_COMMAND_HELP]: "Maximum Members Pickerのヘルプを表示する",
  [SUB_COMMAND_INFO]: "Maximum Members Pickerの情報を表示する",
};

export const MEMBERS_COMMAND_DESC = {
  [TARGET_PREFIX]: "抽選対象をロール、ユーザー、@everyone 等を用いて指定する",
  [SUB_COMMAND_COUNT]: "抽選人数 (デフォルトは 1 人)",
  [EXCLUDE_PREFIX]: "除外したいユーザーやロールを指定する",
};
