import { Channel, Client, EmbedBuilder, TextBasedChannel } from "discord.js";
import { z } from "zod";

const envSchema = z.object({
  BOT_TOKEN: z.string(),
  NOTIFY_CHANNEL_ID: z.string(),
});

const env = envSchema.parse(process.env);
process.env.TZ = "Asia/Tokyo";
const NOTIFICATION_DISABLED_FROM = 0;
const NOTIFICATION_DISABLED_TO = 8;

const isNotificationDisabled = () => {
  const now = new Date();
  const hour = now.getHours();
  return hour >= NOTIFICATION_DISABLED_FROM && hour < NOTIFICATION_DISABLED_TO;
};

const client = new Client({
  intents: ["Guilds", "GuildVoiceStates"],
});

const NOTIFICATION_JOIN_TEMPLATE = (
  username: string,
  channelName: string,
  memberCount: number,
  avatarURL: string
) =>
  new EmbedBuilder({
    title: `VC参加通知`,
    description: `${username} が ${channelName} に参加しました`,
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
      url: avatarURL,
    },
    color: 0xff0000,
  });

const NOTIFICATION_LEAVE_TEMPLATE = (
  username: string,
  channelName: string,
  memberCount: number,
  avatarURL: string
) =>
  new EmbedBuilder({
    title: `VC退出通知`,
    description: `${username} が ${channelName} から退出しました`,
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
      url: avatarURL,
    },
    color: 0x0000ff,
  });

const NOTIFICATION_MOVE_TEMPLATE = (
  username: string,
  oldChannelName: string,
  newChannelName: string,
  memberCount: number,
  avatarURL: string
) =>
  new EmbedBuilder({
    title: `VC移動通知`,
    description: `${username} が ${oldChannelName} から ${newChannelName} に移動しました`,
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
      url: avatarURL,
    },
    color: 0x00ff00,
  });

const isChannelTextBased = (channel?: Channel): channel is TextBasedChannel => {
  // そもそもチャンネルが見つからない場合
  if (!channel) {
    console.error("Channel not found");
    return false;
  }
  // チャンネルがテキストチャンネルでない場合
  if (!channel.isTextBased()) {
    console.error("Channel is not text channel");
    return false;
  }

  return true;
};

const NOT_FOUND_USER_IMAGE_URL =
  "https://images.unsplash.com/photo-1614680376739-414d95ff43df?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1374&q=80";

client.on("voiceStateUpdate", (oldState, newState) => {
  if (isNotificationDisabled()) return;

  const newUserChannel = newState.channel; // 新たに参加したチャンネル
  const oldUserChannel = oldState.channel; // 退出したチャンネル

  // 新たにチャンネルに参加した場合
  if (oldUserChannel === null && newUserChannel !== null) {
    const textChannel = client.channels.cache.get(env.NOTIFY_CHANNEL_ID);
    if (!isChannelTextBased(textChannel)) return;
    textChannel.send({
      embeds: [
        NOTIFICATION_JOIN_TEMPLATE(
          newState.member?.displayName ?? "unknown",
          newUserChannel.name,
          newUserChannel.members.size,
          newState.member?.user.avatarURL() ?? NOT_FOUND_USER_IMAGE_URL
        ),
      ],
    });
    return;
  }

  // チャンネルから退出した場合
  if (oldUserChannel !== null && newUserChannel === null) {
    const textChannel = client.channels.cache.get(env.NOTIFY_CHANNEL_ID);
    if (!isChannelTextBased(textChannel)) return;
    textChannel.send({
      embeds: [
        NOTIFICATION_LEAVE_TEMPLATE(
          newState.member?.displayName ?? "unknown",
          oldUserChannel.name,
          oldUserChannel.members.size,
          newState.member?.user.avatarURL() ?? NOT_FOUND_USER_IMAGE_URL
        ),
      ],
    });
    return;
  }

  // チャンネルを移動した場合
  if (
    oldUserChannel !== null &&
    newUserChannel !== null &&
    oldUserChannel.id !== newUserChannel.id
  ) {
    const textChannel = client.channels.cache.get(env.NOTIFY_CHANNEL_ID);
    if (!isChannelTextBased(textChannel)) return;
    textChannel.send({
      embeds: [
        NOTIFICATION_MOVE_TEMPLATE(
          newState.member?.displayName ?? "unknown",
          oldUserChannel.name,
          newUserChannel.name,
          newUserChannel.members.size,
          newState.member?.user.avatarURL() ?? NOT_FOUND_USER_IMAGE_URL
        ),
      ],
    });
    return;
  }

  // それ以外の場合
  console.error("Unknown Status Case Trace:\n", oldState, newState);
});

client.login(env.BOT_TOKEN);
