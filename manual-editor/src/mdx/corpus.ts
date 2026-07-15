import path from "node:path";
import fs from "node:fs";
import { REPO_ROOT } from "./normalize";
import { roundTrip } from "./pipeline";
import { formatMdx } from "./normalize";

export function manualDir(): string {
  return path.join(REPO_ROOT, "src", "content", "manual");
}

/** Recursively list every .md/.mdx file under the manual content directory. */
export function listManualFiles(): string[] {
  const root = manualDir();
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(md|mdx)$/.test(entry.name)) out.push(full);
    }
  };
  walk(root);
  return out.sort();
}

export function readManualFile(absPath: string): string {
  return fs.readFileSync(absPath, "utf8");
}

/** The full read->write the editor performs: parse, stringify, prettier. */
export async function safeRoundTrip(source: string): Promise<string> {
  return formatMdx(roundTrip(source));
}
