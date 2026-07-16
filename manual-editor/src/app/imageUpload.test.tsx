/**
 * Headless coverage for `imageUpload.ts`'s `insertImageFromFile` flow: a
 * real TipTap `Editor` (built the same way `editorExtensions.test.ts` does —
 * `buildAppExtensions()` against a detached `<div>`, no React render needed
 * since this exercises the pure flow function directly, not `Editor.tsx`'s
 * `handlePaste`/`handleDrop` wiring) plus a mocked `api.uploadImage` (via
 * `makeApi` over a fake `fetch`, matching `api.test.ts`'s own pattern) and a
 * stubbed `window.prompt`/`window.alert` (matching
 * `slash/slashIntegration.test.tsx`'s save/restore pattern for
 * `window.prompt`).
 */
import { afterEach, beforeEach, expect, test } from "bun:test";
import { Editor } from "@tiptap/core";
import { buildAppExtensions } from "./editorExtensions";
import { makeApi } from "./api";
import { insertImageFromFile, pageSlugFromPath } from "./imageUpload";
import type { PMNodeJSON } from "../adapter/mdastToDoc";

interface UploadCall {
  pageSlug: string;
  filename: string;
  dataBase64: string;
}

/** Records every `/api/image` POST body; returns `responsePath` on success. */
function fakeFetch(calls: UploadCall[], responsePath: string): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url === "/api/image") {
      const body = JSON.parse(String(init?.body)) as UploadCall;
      calls.push(body);
      return new Response(JSON.stringify({ path: responsePath }), {
        headers: { "content-type": "application/json" },
      });
    }
    throw new Error(`unexpected fetch in imageUpload test: ${url}`);
  }) as typeof fetch;
}

/** Always 500s — for the upload-failure test. */
function failingFetch(): typeof fetch {
  return (async (_input: RequestInfo | URL, _init?: RequestInit) =>
    new Response(JSON.stringify({ error: "disk full" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    })) as typeof fetch;
}

function makeEditor(): Editor {
  return new Editor({
    element: document.createElement("div"),
    extensions: buildAppExtensions(),
    content: "<p>Some text.</p>",
  });
}

function imageNodesIn(json: PMNodeJSON): PMNodeJSON[] {
  const found: PMNodeJSON[] = [];
  if (json.type === "image") found.push(json);
  for (const child of json.content ?? []) found.push(...imageNodesIn(child));
  return found;
}

let originalPrompt: typeof window.prompt;
let originalAlert: typeof window.alert;
let promptCalls: Array<[string, string | undefined]>;
let promptReturn: string | null;
let alertMessages: string[];

beforeEach(() => {
  originalPrompt = window.prompt;
  originalAlert = window.alert;
  promptCalls = [];
  promptReturn = null;
  alertMessages = [];
  window.prompt = ((message?: string, defaultValue?: string) => {
    promptCalls.push([message ?? "", defaultValue]);
    return promptReturn;
  }) as typeof window.prompt;
  window.alert = ((message?: unknown) => {
    alertMessages.push(String(message));
  }) as typeof window.alert;
});

afterEach(() => {
  window.prompt = originalPrompt;
  window.alert = originalAlert;
});

test("pageSlugFromPath strips the manual prefix and .mdx extension", () => {
  expect(
    pageSlugFromPath("src/content/manual/basics/installing-ffmpeg.mdx"),
  ).toBe("basics/installing-ffmpeg");
  expect(pageSlugFromPath("src/content/manual/top.mdx")).toBe("top");
  expect(pageSlugFromPath("src/content/manual/legacy.md")).toBe("legacy");
});

test("a non-image file is a no-op: resolves false, no prompt, no upload", async () => {
  const calls: UploadCall[] = [];
  const api = makeApi(fakeFetch(calls, "src/assets/img/manual/x/y.png"));
  const editor = makeEditor();
  const file = new File(["hello"], "notes.txt", { type: "text/plain" });

  const result = await insertImageFromFile(editor, api, "basics/x", file);

  expect(result).toBe(false);
  expect(promptCalls.length).toBe(0);
  expect(calls.length).toBe(0);
  expect(imageNodesIn(editor.getJSON() as unknown as PMNodeJSON)).toHaveLength(
    0,
  );
  editor.destroy();
});

test("a cancelled prompt (null) is a no-op: resolves false, no upload happens", async () => {
  const calls: UploadCall[] = [];
  const api = makeApi(fakeFetch(calls, "src/assets/img/manual/x/y.png"));
  const editor = makeEditor();
  const file = new File(["fake-bytes"], "shot.png", { type: "image/png" });
  promptReturn = null;

  const result = await insertImageFromFile(editor, api, "basics/x", file);

  expect(result).toBe(false);
  expect(promptCalls.length).toBe(1);
  expect(calls.length).toBe(0);
  expect(imageNodesIn(editor.getJSON() as unknown as PMNodeJSON)).toHaveLength(
    0,
  );
  editor.destroy();
});

test("a blank/whitespace-only alt is a no-op: resolves false, no upload happens", async () => {
  const calls: UploadCall[] = [];
  const api = makeApi(fakeFetch(calls, "src/assets/img/manual/x/y.png"));
  const editor = makeEditor();
  const file = new File(["fake-bytes"], "shot.png", { type: "image/png" });
  promptReturn = "   ";

  const result = await insertImageFromFile(editor, api, "basics/x", file);

  expect(result).toBe(false);
  expect(calls.length).toBe(0);
  expect(imageNodesIn(editor.getJSON() as unknown as PMNodeJSON)).toHaveLength(
    0,
  );
  editor.destroy();
});

test("happy path: uploads the file, then inserts an image node with the returned path + trimmed alt", async () => {
  const calls: UploadCall[] = [];
  const responsePath = "src/assets/img/manual/basics/x/shot-ab12.png";
  const api = makeApi(fakeFetch(calls, responsePath));
  const editor = makeEditor();
  const file = new File(["fake-bytes"], "shot.png", { type: "image/png" });
  promptReturn = "  A screenshot of the toolbar  ";

  const result = await insertImageFromFile(editor, api, "basics/x", file);

  expect(result).toBe(true);
  expect(calls.length).toBe(1);
  expect(calls[0]!.pageSlug).toBe("basics/x");
  expect(calls[0]!.filename).toBe("shot.png");
  expect(typeof calls[0]!.dataBase64).toBe("string");
  expect(calls[0]!.dataBase64.length).toBeGreaterThan(0);

  const images = imageNodesIn(editor.getJSON() as unknown as PMNodeJSON);
  expect(images).toHaveLength(1);
  expect(images[0]!.attrs?.src).toBe(responsePath);
  expect(images[0]!.attrs?.alt).toBe("A screenshot of the toolbar");
  editor.destroy();
});

test("an upload failure alerts a message and inserts no node", async () => {
  const api = makeApi(failingFetch());
  const editor = makeEditor();
  const file = new File(["fake-bytes"], "shot.png", { type: "image/png" });
  promptReturn = "A screenshot";

  const result = await insertImageFromFile(editor, api, "basics/x", file);

  expect(result).toBe(false);
  expect(alertMessages.length).toBe(1);
  expect(alertMessages[0]).toContain("Image upload failed");
  expect(imageNodesIn(editor.getJSON() as unknown as PMNodeJSON)).toHaveLength(
    0,
  );
  editor.destroy();
});
