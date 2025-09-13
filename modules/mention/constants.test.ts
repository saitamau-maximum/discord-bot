import { matchWithIds } from "./mention";

describe("matchWithIds", () => {
  const PATTERN = /^m\.([a-zA-Z0-9_-]+)$/g;
  it("should match with display ids by mention pattern", () => {
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
