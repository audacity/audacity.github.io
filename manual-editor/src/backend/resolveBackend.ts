import type { GitHubBackend } from "./types";
import { InMemoryBackend, loadCorpusSeed } from "./inMemoryBackend";

let cachedDev: InMemoryBackend | null = null;

export function getBackend(token: string | null): GitHubBackend {
  const devMode = process.env.DEV_AUTH === "1" || !token;
  if (devMode) {
    if (!cachedDev) cachedDev = new InMemoryBackend(loadCorpusSeed());
    return cachedDev;
  }
  // Phase G swaps this for `new OctokitBackend(token, ...)`.
  throw new Error("Production backend not wired until Phase G");
}
