import { Channel, Client, EmbedBuilder, TextBasedChannel } from "discord.js";
import { z } from "zod";

const envSchema = z.object({
  BOT_TOKEN: z.string(),
  NOTIFY_CHANNEL_ID: z.string(),
});

const env = envSchema.parse(process.env);

const client = new Client({
  intents: ["Guilds", "GuildVoiceStates"],
});

const NOTIFICATION_JOIN_TEMPLATE = (
  username: string,
  channelName: string,
  memberCount: number
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
    color: 0xff0000,
  });

const NOTIFICATION_LEAVE_TEMPLATE = (
  username: string,
  channelName: string,
  memberCount: number
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
    color: 0x0000ff,
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

client.on("voiceStateUpdate", (oldState, newState) => {
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
          newUserChannel.members.size
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
          oldUserChannel.members.size
        ),
      ],
    });
    return;
  }

  // チャンネルを移動した場合
  if (oldUserChannel !== null && newUserChannel !== null) {
    const textChannel = client.channels.cache.get(env.NOTIFY_CHANNEL_ID);
    if (!isChannelTextBased(textChannel)) return;
    textChannel.send({
      embeds: [
        NOTIFICATION_LEAVE_TEMPLATE(
          newState.member?.displayName ?? "unknown",
          oldUserChannel.name,
          oldUserChannel.members.size
        ),
        NOTIFICATION_JOIN_TEMPLATE(
          newState.member?.displayName ?? "unknown",
          newUserChannel.name,
          newUserChannel.members.size
        ),
      ],
    });
    return;
  }

  // それ以外の場合
  console.error("Unknown Status Case Trace:\n", oldState, newState);
});

client.login(env.BOT_TOKEN);
