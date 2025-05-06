export const BASE_COMMAND = "pick";

export const TARGET_PREFIX = "target";
export const SUB_COMMAND_COUNT = "count";
export const EXCLUDE_PREFIX = "exclude";

export const OPTION_COUNT = 3;

export const SUB_COMMANDS = {
  [TARGET_PREFIX]: "抽選対象をロール、ユーザー、@everyone 等を用いて指定する",
  [SUB_COMMAND_COUNT]: "抽選人数 (デフォルトは 1 人)",
  [EXCLUDE_PREFIX]: "除外したいユーザーやロールを指定する",
};
