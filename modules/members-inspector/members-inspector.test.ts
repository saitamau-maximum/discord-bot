import { Client } from "discord.js";
import { Degree, Member } from "./constants";
import { MembersInspector, maxGrade, parseGrade } from "./members-inspector";
import { Env } from "../../main";

const GradedUser = (name: string, grade: string[], isActive = true) =>
  ({
    name,
    grade: grade.map(parseGrade),
    isActive,
  } as Member);

describe("grade", () => {
  describe("parseGrade", () => {
    it("学年と学位が正しくパースされる", () => {
      expect(parseGrade("21B")).toEqual({
        year: 21,
        degree: Degree.Bachelor,
      });
      expect(parseGrade("21M")).toEqual({
        year: 21,
        degree: Degree.Master,
      });
      expect(parseGrade("21D")).toEqual({
        year: 21,
        degree: Degree.Doctor,
      });
    });

    it("学位がB, M, D以外の場合はエラーになる", () => {
      expect(() => parseGrade("21A")).toThrow();
      expect(() => parseGrade("21C")).toThrow();
      expect(() => parseGrade("21E")).toThrow();
    });
  });

  describe("maxGrade", () => {
    it("学位が大きい方が優先される", () => {
      const grade1 = { year: 21, degree: Degree.Bachelor };
      const grade2 = { year: 18, degree: Degree.Master };
      const grade3 = { year: 23, degree: Degree.Doctor };

      expect(maxGrade(grade1, grade2, grade3)).toEqual(grade3);
    });

    it("学位が同じ場合は学年が小さい方が優先される", () => {
      const grade1 = { year: 21, degree: Degree.Bachelor };
      const grade2 = { year: 18, degree: Degree.Bachelor };
      const grade3 = { year: 23, degree: Degree.Bachelor };

      expect(maxGrade(grade1, grade2, grade3)).toEqual(grade2);
    });
  });
});

describe("MembersInspector", () => {
  describe("sortMembers", () => {
    it("グレードと学位が同じ場合は名前順にソートされる", () => {
      const inspector = new MembersInspector({} as Client, {} as Env);
      const sortedMembers = inspector.sortMembers([
        GradedUser("A", ["21B"]),
        GradedUser("B", ["21B"]),
        GradedUser("C", ["21B"]),
      ]);
      expect(sortedMembers.map((member) => member.name)).toEqual([
        "A",
        "B",
        "C",
      ]);
    });

    it("グレードが異なり、学位が同じ場合は学年順にソートされる", () => {
      const inspector = new MembersInspector({} as Client, {} as Env);
      const sortedMembers = inspector.sortMembers([
        GradedUser("A", ["21B"]),
        GradedUser("B", ["23B"]),
        GradedUser("C", ["25B"]),
      ]);
      expect(sortedMembers.map((member) => member.name)).toEqual([
        "A",
        "B",
        "C",
      ]);
    });

    it("学位が異なり、学年が同じ場合は学位順にソートされる", () => {
      const inspector = new MembersInspector({} as Client, {} as Env);
      const sortedMembers = inspector.sortMembers([
        GradedUser("A", ["21B"]),
        GradedUser("B", ["21M"]),
        GradedUser("C", ["21D"]),
      ]);
      expect(sortedMembers.map((member) => member.name)).toEqual([
        "C",
        "B",
        "A",
      ]);
    });

    it("非アクティブなメンバーが下に来る", () => {
      const inspector = new MembersInspector({} as Client, {} as Env);
      const sortedMembers = inspector.sortMembers([
        GradedUser("A", ["21B"], false),
        GradedUser("B", ["21B"], true),
      ]);
      expect(sortedMembers.map((member) => member.name)).toEqual(["B", "A"]);
    });

    it("複数グレードを持つメンバーがいる場合は最大のグレードが優先される", () => {
      const inspector = new MembersInspector({} as Client, {} as Env);
      const sortedMembers = inspector.sortMembers([
        GradedUser("A", ["21B", "25M"]),
        GradedUser("B", ["23B"]),
      ]);
      expect(sortedMembers.map((member) => member.name)).toEqual(["A", "B"]);
    });

    it("すべて統合したソートができる", () => {
      const inspector = new MembersInspector({} as Client, {} as Env);
      const sortedMembers = inspector.sortMembers([
        GradedUser("A", ["21B"], true),
        GradedUser("B", ["23B"], true),
        GradedUser("C", ["25B"], true),
        GradedUser("D", ["21B", "25M"], true),
        GradedUser("E", ["21B"], false),
        GradedUser("F", ["21M"], true),
        GradedUser("G", ["21M"], false),
      ]);

      expect(sortedMembers.map((member) => member.name)).toEqual([
        "F",
        "D",
        "A",
        "B",
        "C",
        "G",
        "E",
      ]);
    });
  });
});
