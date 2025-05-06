import { describe, it, expect, vi, beforeEach } from "vitest";
import { Client, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { MembersPicker } from "./members-picker";
import {
  BASE_COMMAND,
  TARGET_PREFIX,
  SUB_COMMAND_COUNT,
  EXCLUDE_PREFIX,
} from "./constants";
import { Env } from "../../main";

class FakeGuildMember {
  id: string;
  constructor(id: string) {
    this.id = id;
  }
  toString() {
    return `<@${this.id}>`;
  }
}

class FakeGuild {
  members: { resolve: (id: string) => GuildMember | undefined };
  private memberMap: Record<string, GuildMember>;
  constructor(members: GuildMember[]) {
    this.memberMap = {};
    for (const m of members) {
      this.memberMap[m.id] = m;
    }
    this.members = {
      resolve: (id: string) => this.memberMap[id],
    };
  }
}

// FakeClient では "interactionCreate" イベントだけサポートさせる
interface FakeClient {
  on: (
    event: "interactionCreate",
    cb: (interaction: ChatInputCommandInteraction) => void
  ) => void;
  user: { id: string };
}

describe("MembersPicker", () => {
  let fakeClient: FakeClient;
  let env: Env;
  let picker: MembersPicker;
  let interactionCallback: (
    interaction: ChatInputCommandInteraction
  ) => Promise<void>;

  beforeEach(() => {
    fakeClient = {
      on: (
        event: "interactionCreate",
        cb: (interaction: ChatInputCommandInteraction) => void
      ) => {
        if (event === "interactionCreate") {
          interactionCallback = async (
            interaction: ChatInputCommandInteraction
          ) => {
            cb(interaction);
            return Promise.resolve();
          };
        }
      },
      user: { id: "bot" },
    };
    env = {} as Env;
    picker = new MembersPicker(fakeClient as Client, env);
  });

  it("command() は正しいスラッシュコマンドを返す", () => {
    const commands = picker.command();
    expect(commands).toHaveLength(1);
    expect(commands[0]).toBeDefined();
    if (commands[0] !== undefined) {
      expect(commands[0].name).toBe(BASE_COMMAND);
      const options = commands[0].options;
      expect(options).toBeDefined();
      expect(options!.length).toBe(7);
    }
  });

  it("help() は基本コマンドを含むヘルプ文字列を返す", () => {
    const helpStr = picker.help();
    expect(helpStr).toContain(`Base Commands: [ ${BASE_COMMAND} ]`);
  });

  it("サーバー内で実行されていない場合はエラーメッセージを返信する", async () => {
    picker.init();
    const fakeInteraction = {
      isChatInputCommand: () => true,
      commandName: BASE_COMMAND,
      options: {
        getMentionable: () => null,
        getInteger: () => 1,
      },
      reply: vi.fn(),
      guild: undefined,
    } as unknown as ChatInputCommandInteraction;

    await interactionCallback(fakeInteraction);
    expect(fakeInteraction.reply).toHaveBeenCalledWith(
      "このコマンドは DM 等では使用できません。サーバー内で使用してください。"
    );
  });

  it("有効なメンバーの中から選出して返信する", async () => {
    const member1 = new FakeGuildMember("1") as GuildMember;
    const member2 = new FakeGuildMember("2") as GuildMember; // 除外対象
    const fakeGuild = new FakeGuild([member1, member2]);

    // ターゲット (member1) と除外対象 (member2) を返すフェイクオプション
    const fakeOptions = {
      getMentionable: (name: string) => {
        if (name === `${TARGET_PREFIX}1`) return member1;
        if (name === `${EXCLUDE_PREFIX}1`) return member2;
        return null;
      },
      getInteger: (name: string) => {
        if (name === SUB_COMMAND_COUNT) return 1;
        return null;
      },
    };

    const fakeInteraction = {
      isChatInputCommand: () => true,
      commandName: BASE_COMMAND,
      options: fakeOptions,
      reply: vi.fn(),
      guild: fakeGuild,
    } as unknown as ChatInputCommandInteraction;

    picker.init();
    await interactionCallback(fakeInteraction);

    // 返信メッセージに member1 のメンションが含まれていることを検証
    expect(fakeInteraction.reply).toHaveBeenCalled();
    const replyArg = (fakeInteraction.reply as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(replyArg).toContain(member1.toString());
  });
});
