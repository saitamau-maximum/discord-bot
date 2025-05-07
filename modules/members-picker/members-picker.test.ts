import { describe, it, expect, vi, beforeEach } from "vitest";
import { Client, ChatInputCommandInteraction, GuildMember } from "discord.js";
import { MembersPicker } from "./members-picker";
import {
  BASE_COMMAND,
  TARGET_PREFIX,
  SUB_COMMAND_COUNT_OPTION,
  EXCLUDE_PREFIX,
  SUB_COMMAND_MEMBERS,
  OPTION_COUNT,
  SUB_COMMAND_BOT_OPTION,
  SUB_COMMAND_HELP,
  SUB_COMMAND_INFO,
} from "./constants";
import { Env } from "../../main";

class FakeGuildMember {
  id: string;
  user: { bot: boolean };
  constructor(id: string, bot: boolean = false) {
    this.id = id;
    this.user = { bot };
  }
  toString() {
    return `<@${this.id}>`;
  }
}

class FakeGuild {
  members: {
    resolve: (id: string) => GuildMember | undefined;
    fetch: () => Promise<void>;
  };
  private memberMap: Record<string, GuildMember>;
  constructor(members: GuildMember[]) {
    this.memberMap = {};
    for (const m of members) {
      this.memberMap[m.id] = m;
    }
    this.members = {
      resolve: (id: string) => this.memberMap[id],
      fetch: async () => {
        console.log("fetch() called");
      },
    };
  }
}

// FakeClient は "interactionCreate" イベントのみをサポートする
interface FakeClient {
  on: (
    event: "interactionCreate",
    cb: (interaction: ChatInputCommandInteraction) => void
  ) => void;
  user: { id: string };
}

// targets, excludes, count, bots の個数
const expectedOptionsLength = OPTION_COUNT + OPTION_COUNT + 2;

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
            await cb(interaction);
          };
        }
      },
      user: { id: "bot" },
    };
    env = {} as Env;
    picker = new MembersPicker(fakeClient as Client, env);
  });

  describe("MembersPicker Command", () => {
    let picker: MembersPicker;

    beforeAll(() => {
      picker = new MembersPicker({} as any, {} as any);
    });

    test("MembersPicker.command()[0]に 3 つのサブコマンドが含まれる", () => {
      const commandJSON = picker.command()[0];
      expect(commandJSON.name).toBe(BASE_COMMAND);
      const options = commandJSON.options ?? [];
      expect(options.length).toBe(3);
      const subNames = options.map((opt: any) => opt.name);
      expect(subNames).toContain(SUB_COMMAND_MEMBERS);
      expect(subNames).toContain(SUB_COMMAND_HELP);
      expect(subNames).toContain(SUB_COMMAND_INFO);
    });

    test("members サブコマンドのオプションが正しく設定されている", () => {
      const commandJSON = picker.command()[0];
      const membersSub = (commandJSON.options as any[] | undefined)?.find(
        (opt) => opt.name === SUB_COMMAND_MEMBERS
      );
      expect(membersSub).toBeDefined();
      const options = (membersSub).options ?? [];

      expect(options.length).toBe(expectedOptionsLength);
    });
  });

  it("command() は正しいスラッシュコマンドを返す", () => {
    const commands = picker.command();
    expect(commands).toHaveLength(1);
    expect(commands[0]).toBeDefined();
    if (commands[0]) {
      expect(commands[0].name).toBe(BASE_COMMAND);
      // members, help, info のサブコマンドがあるはず
      expect(commands[0].options).toBeDefined();
      expect(commands[0].options!.length).toBe(3);

      // members サブコマンドには (target * 1 + target追加 * (OPTION_COUNT - 1) + integer + exclude * OPTION_COUNT) 個のオプションがあるはず
      const membersSub = commands[0].options?.find(
        (o) => o.name === SUB_COMMAND_MEMBERS
      );
      expect(membersSub).toBeDefined();
      if (
        membersSub &&
        "options" in membersSub &&
        Array.isArray(membersSub.options)
      ) {
        expect(membersSub.options.length).toBe(expectedOptionsLength);
      }
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
        getSubcommand: () => SUB_COMMAND_MEMBERS,
        getMentionable: () => null,
        getInteger: () => 1,
        getBoolean: () => false,
      },
      reply: vi.fn(),
      guild: undefined,
    } as unknown as ChatInputCommandInteraction;

    await interactionCallback(fakeInteraction);
    expect(fakeInteraction.reply).toHaveBeenCalledWith({
      content:
        "このコマンドは DM 等では使用できません。サーバー内で使用してください。",
    });
  });

  it("有効なメンバーの中から選出して返信する", async () => {
    const member1 = new FakeGuildMember("1") as GuildMember;
    const member2 = new FakeGuildMember("2") as GuildMember;

    const fakeGuild = new FakeGuild([member1, member2]);

    // ターゲット (member1) と除外対象 (member2) を返す
    const fakeOptions = {
      getSubcommand: () => SUB_COMMAND_MEMBERS,
      getMentionable: (name: string) => {
        if (name === `${TARGET_PREFIX}1`) return member1;
        if (name === `${EXCLUDE_PREFIX}1`) return member2;
        return null;
      },
      getInteger: (name: string) => {
        if (name === SUB_COMMAND_COUNT_OPTION) return 1;
        return null;
      },
      getBoolean: (name: string) => false,
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

    expect(replyArg.content).toContain(member1.toString());
  });

  it("bots オプションが false の場合、Bot が除外される", async () => {
    const human = new FakeGuildMember("human1", false) as GuildMember;
    const botMember = new FakeGuildMember("bot1", true) as GuildMember;

    const fakeGuild = new FakeGuild([human, botMember]);

    // target1: human, target2: botMember と指定する
    const fakeOptions = {
      getSubcommand: () => SUB_COMMAND_MEMBERS,
      getMentionable: (name: string) => {
        if (name === `${TARGET_PREFIX}1`) return human;
        if (name === `${TARGET_PREFIX}2`) return botMember;
        return null;
      },
      getInteger: (name: string) => {
        if (name === SUB_COMMAND_COUNT_OPTION) return 1;
        return null;
      },
      getBoolean: (name: string) => {
        if (name === SUB_COMMAND_BOT_OPTION) return false;
        return false;
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

    const replyArg = (fakeInteraction.reply as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    console.log(replyArg.content);

    expect(replyArg.content).toContain((human as FakeGuildMember).toString());
    expect(replyArg.content).not.toContain(
      (botMember as FakeGuildMember).toString()
    );
  });
});
