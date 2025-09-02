export const BASE_COMMAND = "point";

export const SUB_COMMAND_RANKING = "ranking";
export const SUB_COMMAND_HELP = "help";
export const SUB_COMMAND_INFO = "info";
export const SUB_COMMAND_MY_POINTS = "mypoints";

export const SUB_COMMANDS: Record<string, string> = {
  [SUB_COMMAND_RANKING]: "ポイントランキングを表示します",
  [SUB_COMMAND_MY_POINTS]: "自分のポイントを確認します",
  [SUB_COMMAND_HELP]: "ヘルプを表示します",
  [SUB_COMMAND_INFO]: "モジュール情報を表示します",
};

export const POINTS_FILE = "points.json";
export const TARGET_EMOJI = "<:maximum_point:1330852386322780220>";
