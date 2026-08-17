import { afterEach } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
GlobalRegistrator.register();

/**
 * The whole suite (`draft.test.ts`, `page.test.ts`, etc. — see their doc
 * comments) exercises the real Netlify function handlers against the dev
 * (in-memory) backend, which `_shared.ts#backendFor`/`_session.ts
 * #getSessionSecret` only resolve without a `SESSION_SECRET` when
 * `DEV_AUTH=1`. Defaulting it here (individual tests that need to exercise
 * the non-dev path, e.g. `_session.test.ts`'s `getSessionSecret` tests,
 * save/restore it locally) keeps that dev-mode assumption true regardless
 * of file run order.
 */
process.env.DEV_AUTH ??= "1";

/**
 * `@testing-library/react` auto-registers an `afterEach(cleanup)` (unmounting
 * every `render()` and clearing the DOM between tests) IF it detects a
 * global `afterEach` — see its `dist/index.js`. Bun's test runner doesn't
 * put `afterEach` on `globalThis` just because `bun:test` exists somewhere
 * in the module graph (only an explicit `import { afterEach } from
 * "bun:test"` makes it callable), so that auto-detection silently no-ops
 * under `bun test` and every `render()` in a test file accumulates in the
 * same `happy-dom` `document.body` instead of being torn down. Multiple
 * tests in one file that both render a component sharing a `data-testid`
 * (e.g. two `render(<Editor .../>)` calls, each producing a
 * `data-testid="editor"`) then intermittently fail `getByTestId` with a
 * "multiple elements found" error depending on run order/timing. Wiring
 * cleanup explicitly here (this file is preloaded for every test, see
 * `bunfig.toml`) fixes that for the whole suite.
 *
 * `@testing-library/react` is imported dynamically, AFTER
 * `GlobalRegistrator.register()` has run, rather than via a top-level
 * `import` — a static `import` is evaluated before any of this module's own
 * statements (including `register()`) regardless of where the import line
 * appears in the file, so `@testing-library/dom`'s environment detection
 * (used by `screen`/`waitFor`) would otherwise run against a `document`-less
 * global and permanently misconfigure itself for the rest of the test file.
 */
const { cleanup } = await import("@testing-library/react");

afterEach(() => {
  cleanup();
});
