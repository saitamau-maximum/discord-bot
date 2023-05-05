import { EmbedBuilder } from "discord.js";
import { USER_IMAGE_NOT_FOUND_URL } from "./constants";

export const NOTIFICATION_TEMPLATE = (
  type: "join" | "leave" | "move",
  username: string | undefined = "unknown",
  channelName: string,
  memberCount: number,
  avatarURL?: string | null
) => {
  let title: string;
  let description: string;
  let color: number;
  switch (type) {
    case "join":
      title = "VC参加通知";
      description = `${username} が ${channelName} に参加しました`;
      color = 0xff0000;
      break;
    case "leave":
      title = "VC退出通知";
      description = `${username} が ${channelName} から退出しました`;
      color = 0x0000ff;
      break;
    case "move":
      title = "VC移動通知";
      description = `${username} が ${channelName} に移動しました`;
      color = 0x00ff00;
      break;
  }
  return new EmbedBuilder({
    title,
    description,
    fields: [
      {
        name: "現在の参加人数",
        value: `${memberCount}`,
        inline: true,
      },
      {
        name: "時刻",
        value: new Date().toLocaleString(),
        inline: true,
      },
    ],
    image: {
      url: avatarURL ?? USER_IMAGE_NOT_FOUND_URL,
    },
    color,
  });
};
