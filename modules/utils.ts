import { Channel, TextBasedChannel } from "discord.js";
import { DiscordBotModule } from "./generic";
import { HELP_TEMPLATE } from "./template";

const CHANNEL_NOT_FOUND_MESSAGE = "Channel not found";
const CHANNEL_NOT_TEXT_BASED_MESSAGE = "Channel is not text channel";

export const isChannelTextBased = (
  channel?: Channel
): channel is TextBasedChannel => {
  // そもそもチャンネルが見つからない場合
  if (!channel) {
    console.error(CHANNEL_NOT_FOUND_MESSAGE);
    return false;
  }
  // チャンネルがテキストチャンネルでない場合
  if (!channel.isTextBased()) {
    console.error(CHANNEL_NOT_TEXT_BASED_MESSAGE);
    return false;
  }

  return true;
};

export const getHelpFromModule = (module: DiscordBotModule) => {
  const commandPrefixes = module.commandPrefixes.join(" or ");
  const commands = module.commands
    .map((command) => `[${commandPrefixes}] ${command.command}`)
    .join("\n");
  return HELP_TEMPLATE(
    module.name,
    module.version,
    module.author,
    module.description,
    commands
  );
};

export const getCommandsFromModule = (module: DiscordBotModule) => {
  const commands = module.commandPrefixes
    .map((prefix) =>
      module.commands.map((command) => ({
        command: `${prefix} ${command.command}`,
        callback: command.callback,
      }))
    )
    .flat();
  return commands;
};
