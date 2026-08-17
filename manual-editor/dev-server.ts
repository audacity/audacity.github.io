// Local Bun dev server for manual-editor.
//
// Workaround for netlify-cli being incompatible with the installed Node 24
// (crashes with "Cannot read properties of undefined (reading 'Cjs')").
//
// Spawns Vite on :5273 for the React app + HMR, and serves an HTTP server on
// :8873 that proxies everything to Vite except `/api/*`, which it dispatches
// directly to the Netlify v2 function modules in `netlify/functions/`,
// replicating the `/api/*` -> `/.netlify/functions/:splat` redirect in
// netlify.toml.

if (!process.env.DEV_AUTH) process.env.DEV_AUTH = "1";

const VITE_PORT = 5273;
const SERVER_PORT = 8873;
const VITE_ORIGIN = `http://localhost:${VITE_PORT}`;

type NetlifyHandler = (request: Request) => Promise<Response>;

const vite = Bun.spawn(
  ["bunx", "vite", "--port", String(VITE_PORT), "--strictPort"],
  {
    cwd: import.meta.dir,
    stdout: "inherit",
    stderr: "inherit",
  },
);

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function handleApi(
  request: Request,
  pathname: string,
): Promise<Response> {
  // /api/<name>[/...] -> netlify/functions/<name>.ts default export
  const segments = pathname.split("/").filter(Boolean); // ["api", "<name>", ...]
  const name = segments[1];
  if (!name) return jsonError(404, "not found");

  const modulePath = `${import.meta.dir}/netlify/functions/${name}.mts`;

  let mod: Record<string, unknown>;
  try {
    mod = await import(modulePath);
  } catch {
    return jsonError(404, `no function named "${name}"`);
  }

  const handler = mod.default as NetlifyHandler | undefined;
  if (typeof handler !== "function") {
    return jsonError(404, `function "${name}" has no default export`);
  }

  try {
    return await handler(request);
  } catch (err) {
    return jsonError(500, err instanceof Error ? err.message : String(err));
  }
}

async function proxyToVite(
  request: Request,
  pathname: string,
  search: string,
): Promise<Response> {
  const target = `${VITE_ORIGIN}${pathname}${search}`;
  const init: RequestInit = {
    method: request.method,
    headers: request.headers,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }
  return fetch(target, init);
}

async function waitForVite(timeoutMs = 15000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await fetch(VITE_ORIGIN, { method: "GET" });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error(
    `vite did not become reachable on ${VITE_ORIGIN} within ${timeoutMs}ms`,
  );
}

const server = Bun.serve({
  port: SERVER_PORT,
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, url.pathname);
    }

    try {
      return await proxyToVite(request, url.pathname, url.search);
    } catch {
      return jsonError(
        502,
        "vite dev server is not reachable yet, try again shortly",
      );
    }
  },
});

function shutdown(): void {
  vite.kill();
  server.stop();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

waitForVite()
  .then(() => {
    console.log(`manual-editor dev on http://localhost:${SERVER_PORT}`);
  })
  .catch((err) => {
    console.error(err);
  });
