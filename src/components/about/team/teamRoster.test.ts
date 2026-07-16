import { describe, expect, test } from "bun:test";
import { TEAM_ROSTER } from "./teamRoster.js";

describe("TEAM_ROSTER", () => {
  test("has exactly 10 members", () => {
    expect(TEAM_ROSTER).toHaveLength(10);
  });

  test("every member has required fields", () => {
    for (const m of TEAM_ROSTER) {
      expect(typeof m.id).toBe("string");
      expect(m.id.length).toBeGreaterThan(0);
      expect(typeof m.name).toBe("string");
      expect(m.name.length).toBeGreaterThan(0);
      expect(typeof m.role).toBe("string");
      expect(m.role.length).toBeGreaterThan(0);
      expect(m.initials).toMatch(/^[A-Z]{1,2}$/);
      expect(m.avatarColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      // photo is null (placeholder) or a string path
      expect(m.photo === null || typeof m.photo === "string").toBe(true);
    }
  });

  test("ids are unique", () => {
    const ids = TEAM_ROSTER.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
