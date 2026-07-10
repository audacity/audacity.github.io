// src/components/about/team/chatScript.test.ts
import { describe, expect, test } from "bun:test";
import { CHAT_SCRIPT } from "./chatScript.js";
import { TEAM_ROSTER } from "./teamRoster.js";

describe("CHAT_SCRIPT", () => {
  const ids = new Set(TEAM_ROSTER.map((m) => m.id));

  test("is a non-empty list", () => {
    expect(CHAT_SCRIPT.length).toBeGreaterThan(0);
  });

  test("every line has a valid roster authorId and non-empty text", () => {
    for (const line of CHAT_SCRIPT) {
      expect(ids.has(line.authorId)).toBe(true);
      expect(typeof line.text).toBe("string");
      expect(line.text.trim().length).toBeGreaterThan(0);
    }
  });

  test("does not mention Zoom", () => {
    for (const line of CHAT_SCRIPT) {
      expect(line.text.toLowerCase()).not.toContain("zoom");
    }
  });
});
