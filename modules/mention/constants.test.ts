import { matchWithIds } from "./mention";

describe("MAXIMUM_DISPLAY_ID_PATTERNS", () => {
  const PATTERN = /^m\.([a-zA-Z0-9_-]+)$/g;
  it("should match maximum display id", () => {
    const content = `
m.test1
テスト m.test2 テスト
maximum.vc
　m.test3\t
m.test4.com
    `.trim();

    expect(matchWithIds(content, PATTERN)).toEqual(["test1", "test2", "test3"]);
  });
});
