import { Client } from "discord.js";

import { DiscordBotModule } from "../generic";
import { getHelpFromModule, isChannelTextBased } from "../utils";
import { NOTIFICATION_TEMPLATE } from "./template";
import {
  NOTIFICATION_DISABLED_FROM,
  NOTIFICATION_DISABLED_TO,
} from "./constants";
import { Env } from "../../main";

const isNotificationDisabled = () => {
  const now = new Date();
  const hour = now.getHours();
  return hour >= NOTIFICATION_DISABLED_FROM && hour < NOTIFICATION_DISABLED_TO;
};

export class VoiceChannelNotifier extends DiscordBotModule {
  enabled: boolean;

  constructor(client: Client, env: Env) {
    super(
      client,
      env,
      "VC通知めりん",
      ["/vc-notifier", "/vcn"],
      [
        {
          command: "",
          description: "VC通知めりんのヘルプを表示する",
        },
        {
          command: "disable",
          description: "VC通知めりんを無効化する",
        },
        {
          command: "enable",
          description: "VC通知めりんを有効化する",
        },
      ],
      "VC参加、退出、移動時に通知を送信するBOT",
      "1.2.0",
      "sor4chi"
    );
    this.enabled = true;
  }

  init() {
    this.client.on("voiceStateUpdate", (oldState, newState) => {
      if (!this.enabled || isNotificationDisabled()) return;

      const newUserChannel = newState.channel; // 新たに参加したチャンネル
      const oldUserChannel = oldState.channel; // 退出したチャンネル
      const notifyChannel = this.client.channels.cache.get(
        this.env.NOTIFY_CHANNEL_ID
      );

      // 新たにチャンネルに参加した場合
      if (oldUserChannel === null && newUserChannel !== null) {
        if (!isChannelTextBased(notifyChannel)) return;
        notifyChannel.send({
          embeds: [
            NOTIFICATION_TEMPLATE(
              "join",
              newState.member?.displayName,
              newUserChannel.name,
              newUserChannel.members.size,
              newState.member?.user.avatarURL()
            ),
          ],
        });
        return;
      }

      // チャンネルから退出した場合
      if (oldUserChannel !== null && newUserChannel === null) {
        if (!isChannelTextBased(notifyChannel)) return;
        notifyChannel.send({
          embeds: [
            NOTIFICATION_TEMPLATE(
              "leave",
              oldState.member?.displayName,
              oldUserChannel.name,
              oldUserChannel.members.size,
              oldState.member?.user.avatarURL()
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
        if (!isChannelTextBased(notifyChannel)) return;
        notifyChannel.send({
          embeds: [
            NOTIFICATION_TEMPLATE(
              "move",
              newState.member?.displayName,
              newUserChannel.name,
              newUserChannel.members.size,
              newState.member?.user.avatarURL()
            ),
          ],
        });
        return;
      }
    });

    this.client.on("messageCreate", (message) => {
      if (message.author.bot) return;
      if (
        !this.commandPrefixes.some((prefix) =>
          message.content.startsWith(prefix)
        )
      )
        return;

      const args = message.content.split(" ");

      switch (args[1]) {
        case "disable":
          this.enabled = false;
          message.channel.send({
            content: "VC通知めりんを無効化した",
          });
          break;
        case "enable":
          this.enabled = true;
          message.channel.send({
            content: "VC通知めりんを有効化した",
          });
          break;
        default:
          message.channel.send({
            content: getHelpFromModule(this),
          });
          break;
      }
    });
  }
}
