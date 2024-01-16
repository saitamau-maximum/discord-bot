export const MEMBERS_API_ENDPOINT =
  "https://saitamau-maximum.github.io/members";

export type MembersApiResponse = {
  id: string;
  name: string;
  grade: string[];
  isActive: boolean;
}[];

export const BASE_COMMAND = "members";

export const SUB_COMMAND_HELP = "help";
export const SUB_COMMAND_INFO = "info";
export const SUB_COMMAND_SHOW = "show";

export const SUB_COMMANDS = {
  [SUB_COMMAND_SHOW]: "メンバーの登録状況を表示する",
  [SUB_COMMAND_HELP]: "Maximum Members Inspectorのヘルプを表示する",
  [SUB_COMMAND_INFO]: "Maximum Members Inspectorの情報を表示する",
};
