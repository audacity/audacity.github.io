import { execSync } from "node:child_process";
import { statSync } from "node:fs";

/**
 * Returns the most recent date a file was modified, preferring the git
 * commit history (accurate across machines / CI). Falls back to the file's
 * mtime if git isn't available or the file isn't tracked.
 */
export function getLastUpdated(absolutePath: string): Date {
  try {
    const iso = execSync(`git log -1 --format=%cI -- "${absolutePath}"`, {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    if (iso) return new Date(iso);
  } catch {
    // git not available or file not tracked — fall through to mtime.
  }
  try {
    return statSync(absolutePath).mtime;
  } catch {
    return new Date();
  }
}
