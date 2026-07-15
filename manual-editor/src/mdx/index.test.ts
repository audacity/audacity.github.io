import { expect, test } from "bun:test";
import * as api from "./index";

test("public API surface is stable", () => {
  for (const name of [
    "parseMdx",
    "stringifyMdx",
    "roundTrip",
    "formatMdx",
    "safeRoundTrip",
    "listManualFiles",
  ]) {
    expect(typeof (api as Record<string, unknown>)[name]).toBe("function");
  }
});
