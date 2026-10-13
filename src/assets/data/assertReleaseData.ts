/*
  The release data lives in three hand-maintained files that must move
  together when a release ships: audacityReleases.ts (the new version),
  changelog.ts (its notes), olderReleases.ts (an archive entry for the
  PREVIOUS version). 4.0.0 was missing from the archive for eleven days
  because nothing enforced the third step.

  This module throws at import time, so the pages that import it fail
  the production build (Netlify is this site's CI) with a message
  naming the exact edit, instead of deploying a silent gap.

  The invariant: changelog versions minus the current release equal the
  archive versions. A lagging changelog entry for the current release
  is fine (the download pages fall back to /changelog/ by design); a
  missing archive entry for a superseded release is not.
*/
import { audacityReleases } from "./audacityReleases";
import { changelog } from "./changelog";
import { olderReleases } from "./olderReleases";

export function assertReleaseDataInSync(): void {
  const current = audacityReleases.version;
  const noted = new Set(changelog.map((e) => e.version));
  const archived = new Set(olderReleases.map((r) => r.version));

  const missingFromArchive = [...noted].filter(
    (v) => v !== current && !archived.has(v),
  );
  const missingFromChangelog = [...archived].filter((v) => !noted.has(v));

  const problems: string[] = [];
  if (missingFromArchive.length) {
    problems.push(
      `${missingFromArchive.join(", ")} in changelog.ts but not in ` +
        `olderReleases.ts — a superseded release needs an archive entry ` +
        `(this is the step that was forgotten when 4.0.1 shipped).`,
    );
  }
  if (missingFromChangelog.length) {
    problems.push(
      `${missingFromChangelog.join(", ")} in olderReleases.ts but not in ` +
        `changelog.ts — its archive row would link a release-notes page ` +
        `that does not exist.`,
    );
  }

  if (problems.length) {
    throw new Error(
      `Release data files are out of sync (current: ${current}):\n- ` +
        problems.join("\n- "),
    );
  }
}
