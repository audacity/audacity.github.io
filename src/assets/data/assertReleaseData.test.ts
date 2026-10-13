import { describe, expect, it } from "bun:test";
import { assertReleaseDataInSync } from "./assertReleaseData";

/*
  The same invariant the build enforces, as a test, so it also fails
  fast locally before anyone waits on a Netlify build.
*/
describe("release data files", () => {
  it("changelog, archive and current version move together", () => {
    expect(() => assertReleaseDataInSync()).not.toThrow();
  });
});
