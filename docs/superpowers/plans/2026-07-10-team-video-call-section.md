# Team "Video Call" Section — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new about-page section that introduces the 100%-remote team as a generic (non-Zoom) video call: an auto-cycling active speaker, a Speaker/Grid view toggle, and a Chat button that opens a scripted team conversation.

**Architecture:** A React island (`TeamCall.jsx`) imported into `about.astro` with `client:visible`, wrapped in an `about-section` div, following the existing about-page component pattern. State (view mode, active-speaker index, chat open) lives only in the orchestrator; leaf components are presentational. Pure data/logic (roster, chat script, cycle math) live in plain `.js` modules with `bun:test` unit tests. Visual behaviour is verified in the browser preview at `http://localhost:4321/about`.

**Tech Stack:** Astro, React (islands), Tailwind CSS utility classes + inline styles, `bun:test`. Reuses existing hooks `useInView` and `useEntrance` from `src/hooks/`.

## Global Constraints

- **No Zoom branding.** Generic video-call visual language only. No third-party logos, wordmarks, or brand colours. Never use the word "Zoom" in code, copy, comments, or alt text. Refer to it as "a video call."
- **Bun tooling.** Use `bun run …` / `bun test …` (never npm). Test command: `bun test src`.
- **Roster is fixed at 11 members**, names + roles exactly as listed in Task 1. Role labels only (no locations).
- **Photos are placeholders for now** (initials on a coloured circle). Real photos are a later data-only swap into `teamRoster.js`; do not block on them.
- **Interactive elements (v1):** Speaker/Grid toggle, tile hover/click takeover, Chat open/close. Everything else on the control bar is decorative and hidden from assistive tech.
- **Respect `prefers-reduced-motion`:** no auto-cycling under reduced motion; render a static readable state.
- **British spelling** in code comments/copy to match the surrounding page (e.g. "colour" in prose; CSS properties stay standard `color`).

---

## File Structure

All new component/data files live in a new `src/components/about/team/` directory (mirrors the existing `ScrollyLaptopTour/` and `workspaces/` subdirectory pattern).

- `src/components/about/team/teamRoster.js` — roster data array (11 members).
- `src/components/about/team/teamRoster.test.ts` — roster shape/integrity tests.
- `src/components/about/team/chatScript.js` — scripted chat lines (placeholder copy).
- `src/components/about/team/chatScript.test.ts` — script integrity tests (author ids valid).
- `src/components/about/team/cycle.js` — pure `nextIndex(current, length)` helper.
- `src/components/about/team/cycle.test.ts` — cycle helper tests.
- `src/components/about/team/CallTile.jsx` — one video tile (avatar + label + active ring), rendered as a `<button>`.
- `src/components/about/team/useSpeakerCycle.js` — hook: auto-cycle + takeover + reduced-motion.
- `src/components/about/team/CallControls.jsx` — bottom control bar.
- `src/components/about/team/ChatPanel.jsx` — slide-in chat panel.
- `src/components/about/team/TeamCall.jsx` — orchestrator.
- `src/pages/about.astro` — MODIFY: import + insert section + background colour.

---

## Task 1: Roster data module

**Files:**

- Create: `src/components/about/team/teamRoster.js`
- Test: `src/components/about/team/teamRoster.test.ts`

**Interfaces:**

- Produces: `export const TEAM_ROSTER: Array<{ id: string, name: string, role: string, initials: string, avatarColor: string, photo: string | null }>` — exactly 11 entries, unique `id`s.

- [ ] **Step 1: Write the failing test**

```ts
// src/components/about/team/teamRoster.test.ts
import { describe, expect, test } from "bun:test";
import { TEAM_ROSTER } from "./teamRoster.js";

describe("TEAM_ROSTER", () => {
  test("has exactly 11 members", () => {
    expect(TEAM_ROSTER).toHaveLength(11);
  });

  test("every member has required fields", () => {
    for (const m of TEAM_ROSTER) {
      expect(typeof m.id).toBe("string");
      expect(m.id.length).toBeGreaterThan(0);
      expect(typeof m.name).toBe("string");
      expect(m.name.length).toBeGreaterThan(0);
      expect(typeof m.role).toBe("string");
      expect(m.role.length).toBeGreaterThan(0);
      expect(m.initials).toMatch(/^[A-Z]{1,2}$/);
      expect(m.avatarColor).toMatch(/^#[0-9a-fA-F]{6}$/);
      // photo is null (placeholder) or a string path
      expect(m.photo === null || typeof m.photo === "string").toBe(true);
    }
  });

  test("ids are unique", () => {
    const ids = TEAM_ROSTER.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/components/about/team/teamRoster.test.ts`
Expected: FAIL — cannot resolve `./teamRoster.js`.

- [ ] **Step 3: Write minimal implementation**

```js
// src/components/about/team/teamRoster.js
// Team roster for the video-call section. `photo` is null until real
// webcam-style headshots land — the UI falls back to an initials avatar.
// Swapping photos in is a data-only change: set `photo` to a path under
// /public (e.g. "/team/alex.jpg").
export const TEAM_ROSTER = [
  {
    id: "alex",
    name: "Alex Dawson",
    role: "Product Designer",
    initials: "AD",
    avatarColor: "#7c5cff",
    photo: null,
  },
  {
    id: "anton",
    name: "Anton Chinakov",
    role: "QA Manual Engineer",
    initials: "AC",
    avatarColor: "#cc6655",
    photo: null,
  },
  {
    id: "dmitry",
    name: "Dmitry Makarenko",
    role: "C++ Developer",
    initials: "DM",
    avatarColor: "#55aa88",
    photo: null,
  },
  {
    id: "elnur",
    name: "Elnur Ismailzada",
    role: "C++ Developer",
    initials: "EI",
    avatarColor: "#77aa66",
    photo: null,
  },
  {
    id: "gabriel",
    name: "Gabriel Sartori",
    role: "C++ Developer",
    initials: "GS",
    avatarColor: "#6688bb",
    photo: null,
  },
  {
    id: "grzegorz",
    name: "Grzegorz Wojciechowski",
    role: "C++ Developer",
    initials: "GW",
    avatarColor: "#aa6677",
    photo: null,
  },
  {
    id: "johan",
    name: "Johan Althoff",
    role: "Audacity Product Design",
    initials: "JA",
    avatarColor: "#5599aa",
    photo: null,
  },
  {
    id: "matthieu",
    name: "Matthieu Hodgkinson",
    role: "Senior Audio Developer",
    initials: "MH",
    avatarColor: "#bb8855",
    photo: null,
  },
  {
    id: "paul",
    name: "Paul Martin",
    role: "Audio Developer",
    initials: "PM",
    avatarColor: "#66aa99",
    photo: null,
  },
  {
    id: "sergey",
    name: "Sergey Lapysh",
    role: "QA Manual Engineer",
    initials: "SL",
    avatarColor: "#9966bb",
    photo: null,
  },
  {
    id: "yana",
    name: "Yana Larina",
    role: "Project Manager",
    initials: "YL",
    avatarColor: "#cc7788",
    photo: null,
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/components/about/team/teamRoster.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/about/team/teamRoster.js src/components/about/team/teamRoster.test.ts
git commit -m "feat(team): add roster data module for video-call section"
```

---

## Task 2: Chat script module

**Files:**

- Create: `src/components/about/team/chatScript.js`
- Test: `src/components/about/team/chatScript.test.ts`

**Interfaces:**

- Consumes: `TEAM_ROSTER` from Task 1 (for author-id validation in the test).
- Produces: `export const CHAT_SCRIPT: Array<{ authorId: string, text: string }>` — every `authorId` matches a `TEAM_ROSTER` id.

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/components/about/team/chatScript.test.ts`
Expected: FAIL — cannot resolve `./chatScript.js`.

- [ ] **Step 3: Write minimal implementation**

```js
// src/components/about/team/chatScript.js
// Placeholder scripted conversation for the call's chat panel. Static, not
// real, not live. Final copy is a separate copy pass owned by the design
// lead; any line attributed to a named teammate should be cleared with that
// person before launch. Edit freely here without touching component code.
export const CHAT_SCRIPT = [
  { authorId: "yana", text: "standup in 5, folks 👋" },
  { authorId: "grzegorz", text: "git blame says it was me. it was not me." },
  {
    authorId: "matthieu",
    text: "the reverb tail is 3ms too long and it is ruining my life",
  },
  { authorId: "dmitry", text: "works on my machine ¯\\_(ツ)_/¯" },
  { authorId: "sergey", text: "reproduced. it does not work on my machine." },
  { authorId: "alex", text: "made the button 2px bigger, thoughts?" },
  {
    authorId: "johan",
    text: "who was unmuted talking to their cat for 10 min. it was me. sorry.",
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/components/about/team/chatScript.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/about/team/chatScript.js src/components/about/team/chatScript.test.ts
git commit -m "feat(team): add placeholder chat script module"
```

---

## Task 3: Speaker-cycle pure helper

**Files:**

- Create: `src/components/about/team/cycle.js`
- Test: `src/components/about/team/cycle.test.ts`

**Interfaces:**

- Produces: `export function nextIndex(current: number, length: number): number` — returns the next index, wrapping to 0 at the end; returns 0 for non-positive length.

- [ ] **Step 1: Write the failing test**

```ts
// src/components/about/team/cycle.test.ts
import { describe, expect, test } from "bun:test";
import { nextIndex } from "./cycle.js";

describe("nextIndex", () => {
  test("advances by one", () => {
    expect(nextIndex(0, 5)).toBe(1);
    expect(nextIndex(3, 5)).toBe(4);
  });

  test("wraps to zero at the end", () => {
    expect(nextIndex(4, 5)).toBe(0);
  });

  test("returns 0 for non-positive length", () => {
    expect(nextIndex(2, 0)).toBe(0);
    expect(nextIndex(2, -1)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/components/about/team/cycle.test.ts`
Expected: FAIL — cannot resolve `./cycle.js`.

- [ ] **Step 3: Write minimal implementation**

```js
// src/components/about/team/cycle.js
// Pure helper for advancing the active-speaker index. Kept separate so the
// wrapping math is unit-tested independently of the timer-driven hook.
export function nextIndex(current, length) {
  if (length <= 0) return 0;
  return (current + 1) % length;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/components/about/team/cycle.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/about/team/cycle.js src/components/about/team/cycle.test.ts
git commit -m "feat(team): add active-speaker cycle helper"
```

---

## Task 4: CallTile + minimal grid, integrated into the page

Establishes on-page integration early so every later task can be verified live. Delivers: a `CallTile` component and a minimal `TeamCall` that renders all 11 tiles in a static grid, inserted into `about.astro` before the CTA.

**Files:**

- Create: `src/components/about/team/CallTile.jsx`
- Create: `src/components/about/team/TeamCall.jsx`
- Modify: `src/pages/about.astro` (imports at top; insert section before CTA; add background colour in the `<style>` block)

**Interfaces:**

- Consumes: `TEAM_ROSTER` (Task 1).
- Produces:
  - `CallTile` — default export. Props: `member` (roster entry), `variant` (`"speaker" | "grid" | "filmstrip"`, default `"grid"`), `active` (bool, default `false`), `onSelect` (function, optional). Renders a `<button>`.
  - `TeamCall` — default export, no props. (Expanded in later tasks.)

- [ ] **Step 1: Write CallTile**

```jsx
// src/components/about/team/CallTile.jsx
import React from "react";

// One video-call tile. Avatar is the member's photo when present, else an
// initials circle in their colour. Rendered as a button so it's focusable
// and click-to-spotlight works for keyboard and pointer alike.
function CallTile({ member, variant = "grid", active = false, onSelect }) {
  const isSpeaker = variant === "speaker";
  const isFilm = variant === "filmstrip";

  const avatarSize = isSpeaker ? 92 : isFilm ? 26 : 40;
  const nameSize = isSpeaker ? 14 : 10;

  return (
    <button
      type="button"
      onClick={onSelect ? () => onSelect(member.id) : undefined}
      onMouseEnter={onSelect ? () => onSelect(member.id) : undefined}
      aria-pressed={active}
      aria-label={member.name}
      className={
        "team-tile relative flex items-center justify-center overflow-hidden rounded-[10px] border-0 p-0 cursor-pointer " +
        (isSpeaker ? "w-full h-full" : "aspect-[16/11]")
      }
      style={{
        background: "#262b33",
        boxShadow: active ? "0 0 0 2px #35c46a" : "none",
        transition: "box-shadow 220ms ease",
      }}
    >
      {member.photo ? (
        <img
          src={member.photo}
          alt={member.name}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="flex items-center justify-center rounded-full font-semibold text-white"
          style={{
            width: avatarSize,
            height: avatarSize,
            background: member.avatarColor,
            fontSize: avatarSize * 0.34,
          }}
        >
          {member.initials}
        </span>
      )}

      {!isFilm && (
        <span
          className="absolute left-2 bottom-1.5 max-w-[calc(100%-16px)] truncate rounded-[5px] text-white"
          style={{
            background: "rgba(0,0,0,0.55)",
            padding: isSpeaker ? "6px 10px" : "3px 6px",
            fontSize: nameSize,
            fontWeight: 500,
          }}
        >
          {isSpeaker ? (
            <>
              {member.name}
              <span
                style={{ color: "#9fb0c3", fontWeight: 400, marginLeft: 7 }}
              >
                {member.role}
              </span>
            </>
          ) : (
            member.name
          )}
        </span>
      )}
    </button>
  );
}

export default CallTile;
```

- [ ] **Step 2: Write minimal TeamCall (static grid)**

```jsx
// src/components/about/team/TeamCall.jsx
import React from "react";
import { TEAM_ROSTER } from "./teamRoster.js";
import CallTile from "./CallTile.jsx";

// Team section rendered as a generic video call. This minimal version shows
// all members in a static grid; view toggle, motion, controls, and chat are
// added in later tasks.
function TeamCall() {
  return (
    <section className="px-6 lg:px-10 py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[980px]">
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: "#0c0e12",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          <div className="p-3.5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {TEAM_ROSTER.map((m) => (
                <CallTile key={m.id} member={m} variant="grid" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TeamCall;
```

- [ ] **Step 3: Integrate into about.astro**

In `src/pages/about.astro`, add the import alongside the other about-component imports (near the top `import` block):

```astro
import TeamCall from "../components/about/team/TeamCall.jsx";
```

Insert the section between the existing Under-the-hood interstitial and the CTA section. Find:

```astro
<Interstitial from="#120927" to="rgb(8, 6, 28)" />
<div class="about-section about-section--cta">
  <CtaSection />
</div>
```

Replace with:

```astro
<Interstitial from="#120927" to="rgb(8, 6, 28)" />
<div class="about-section about-section--team">
  <TeamCall client:visible />
</div>
<div class="about-section about-section--cta">
  <CtaSection />
</div>
```

Add the team background colour in the `<style is:global>` block, right before the `.about-section--cta` rule (it shares the CTA's near-black so the existing interstitial bridges into it with no seam):

```css
.about-section--team {
  background-color: rgb(8, 6, 28);
}
```

- [ ] **Step 4: Verify in the browser**

Start the dev server (if not running): `bun run dev`
Open `http://localhost:4321/about` and scroll to just above the "Free, and always will be." CTA.
Expected:

- A dark rounded call card sits in its own full-height section before the CTA.
- 11 tiles in a grid, each showing initials on a coloured circle and the person's name.
- No console errors; no visible seam between this section and the CTA (same background).
- (If the Playwright/preview MCP is available, confirm 11 elements with `.team-tile` and that the section background computes to `rgb(8, 6, 28)`.)

- [ ] **Step 5: Commit**

```bash
git add src/components/about/team/CallTile.jsx src/components/about/team/TeamCall.jsx src/pages/about.astro
git commit -m "feat(team): render roster grid and place section before CTA"
```

---

## Task 5: Speaker view + Speaker/Grid toggle

Adds the two view modes and the top-right toggle. Speaker view = one big active tile + side grid; Grid view = the Task 4 gallery. Active speaker is fixed at index 0 for now (motion arrives in Task 6).

**Files:**

- Modify: `src/components/about/team/TeamCall.jsx`

**Interfaces:**

- Produces (internal): `TeamCall` now holds `view` state (`"speaker" | "grid"`) and `activeIndex` (number, fixed 0 here).

- [ ] **Step 1: Rewrite TeamCall with both views + toggle**

```jsx
// src/components/about/team/TeamCall.jsx
import React, { useState } from "react";
import { TEAM_ROSTER } from "./teamRoster.js";
import CallTile from "./CallTile.jsx";

function ViewToggle({ view, onChange }) {
  const opt = (key, label) => (
    <button
      type="button"
      onClick={() => onChange(key)}
      aria-pressed={view === key}
      className="rounded-2xl px-3 py-1.5 text-[11px] font-semibold"
      style={{
        background: view === key ? "#3a4150" : "transparent",
        color: view === key ? "#fff" : "#8a96a6",
      }}
    >
      {label}
    </button>
  );
  return (
    <div
      className="flex gap-0.5 rounded-2xl p-0.5"
      style={{ background: "#22262e" }}
      role="group"
      aria-label="Call view"
    >
      {opt("speaker", "Speaker")}
      {opt("grid", "Grid")}
    </div>
  );
}

function TeamCall() {
  const [view, setView] = useState("speaker");
  const [activeIndex] = useState(0);

  const active = TEAM_ROSTER[activeIndex];
  const others = TEAM_ROSTER.filter((_, i) => i !== activeIndex);

  return (
    <section className="px-6 lg:px-10 py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[980px]">
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: "#0c0e12",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          {/* Top bar */}
          <div
            className="flex items-center justify-end px-3 py-2.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <ViewToggle view={view} onChange={setView} />
          </div>

          {/* Stage */}
          <div className="p-3.5">
            {view === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {TEAM_ROSTER.map((m, i) => (
                  <CallTile
                    key={m.id}
                    member={m}
                    variant="grid"
                    active={i === activeIndex}
                  />
                ))}
              </div>
            ) : (
              <div className="flex gap-2.5" style={{ height: 300 }}>
                <div className="w-[58%]">
                  <CallTile member={active} variant="speaker" active />
                </div>
                <div className="grid w-[42%] grid-cols-2 gap-2 content-start">
                  {others.map((m) => (
                    <CallTile key={m.id} member={m} variant="grid" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TeamCall;
```

- [ ] **Step 2: Verify in the browser**

Reload `http://localhost:4321/about`, scroll to the team section.
Expected:

- Defaults to **Speaker view**: one large tile (Alex Dawson, with role) on the left, the other 10 in a side grid on the right, green ring on the big tile.
- Clicking **Grid** switches to the 11-tile gallery with the green ring on the first tile; clicking **Speaker** switches back.
- No console errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/about/team/TeamCall.jsx
git commit -m "feat(team): add speaker view and speaker/grid toggle"
```

---

## Task 6: Auto-cycle + hover/click takeover (with reduced-motion)

Adds `useSpeakerCycle`: the active speaker advances on a timer while the section is in view; hovering or clicking a tile takes over and pauses the rotation, which resumes after ~8s idle. Under `prefers-reduced-motion`, no auto-advance.

**Files:**

- Create: `src/components/about/team/useSpeakerCycle.js`
- Modify: `src/components/about/team/TeamCall.jsx`

**Interfaces:**

- Consumes: `nextIndex` (Task 3), `useInView` from `../../../hooks/useInView.js`.
- Produces: `export function useSpeakerCycle({ length, inView }): { activeIndex, selectSpeaker(index) }` — `selectSpeaker` sets the active index and pauses auto-advance for ~8s.

- [ ] **Step 1: Write the hook**

```js
// src/components/about/team/useSpeakerCycle.js
import { useEffect, useRef, useState } from "react";
import { nextIndex } from "./cycle.js";

const STEP_MS = 3500; // time each speaker holds the spotlight
const RESUME_MS = 8000; // idle time before auto-cycle resumes after takeover

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Drives the active-speaker index. Auto-advances while `inView` is true and
// the user hasn't taken over. `selectSpeaker` pins a chosen index and pauses
// the rotation, which resumes after RESUME_MS of no further interaction.
// Honours prefers-reduced-motion by never auto-advancing.
export function useSpeakerCycle({ length, inView }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const resumeTimer = useRef(null);

  // Auto-advance loop.
  useEffect(() => {
    if (!inView || paused || length <= 0) return;
    if (prefersReducedMotion()) return;
    const t = setInterval(() => {
      setActiveIndex((i) => nextIndex(i, length));
    }, STEP_MS);
    return () => clearInterval(t);
  }, [inView, paused, length]);

  // Clean up the resume timer on unmount.
  useEffect(() => {
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  const selectSpeaker = (index) => {
    setActiveIndex(index);
    setPaused(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), RESUME_MS);
  };

  return { activeIndex, selectSpeaker };
}
```

- [ ] **Step 2: Wire the hook into TeamCall**

Replace the state + handlers in `TeamCall` so the active index comes from the hook and tiles call `selectSpeaker`. Update the imports and the component body:

```jsx
// src/components/about/team/TeamCall.jsx  (imports)
import React, { useRef, useState } from "react";
import { TEAM_ROSTER } from "./teamRoster.js";
import CallTile from "./CallTile.jsx";
import { useSpeakerCycle } from "./useSpeakerCycle.js";
import { useInView } from "../../../hooks/useInView.js";
```

Replace the `ViewToggle` definition's surrounding `TeamCall` function (keep `ViewToggle` as-is) with:

```jsx
function TeamCall() {
  const [view, setView] = useState("speaker");
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef);
  const { activeIndex, selectSpeaker } = useSpeakerCycle({
    length: TEAM_ROSTER.length,
    inView,
  });

  const active = TEAM_ROSTER[activeIndex];
  const others = TEAM_ROSTER.filter((_, i) => i !== activeIndex);

  return (
    <section ref={sectionRef} className="px-6 lg:px-10 py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[980px]">
        <div
          className="overflow-hidden rounded-2xl"
          style={{
            background: "#0c0e12",
            boxShadow:
              "0 20px 60px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)",
          }}
        >
          <div
            className="flex items-center justify-end px-3 py-2.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <ViewToggle view={view} onChange={setView} />
          </div>

          <div className="p-3.5">
            {view === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {TEAM_ROSTER.map((m, i) => (
                  <CallTile
                    key={m.id}
                    member={m}
                    variant="grid"
                    active={i === activeIndex}
                    onSelect={() => selectSpeaker(i)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex gap-2.5" style={{ height: 300 }}>
                <div className="w-[58%]">
                  <CallTile member={active} variant="speaker" active />
                </div>
                <div className="grid w-[42%] grid-cols-2 gap-2 content-start">
                  {others.map((m) => {
                    const realIndex = TEAM_ROSTER.findIndex(
                      (x) => x.id === m.id,
                    );
                    return (
                      <CallTile
                        key={m.id}
                        member={m}
                        variant="grid"
                        onSelect={() => selectSpeaker(realIndex)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TeamCall;
```

- [ ] **Step 3: Verify in the browser**

Reload `http://localhost:4321/about`, scroll to the team section and watch it.
Expected:

- The green ring (and, in speaker view, the big tile's person) **advances on its own** every ~3.5s.
- **Hovering or clicking** a side/grid tile immediately promotes that person and **stops** the auto-advance; after ~8s of no interaction it resumes.
- With OS "reduce motion" enabled (macOS: System Settings → Accessibility → Display → Reduce motion), reload: the spotlight is **static** (no auto-advance), but hover/click still works.
- No console errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/about/team/useSpeakerCycle.js src/components/about/team/TeamCall.jsx
git commit -m "feat(team): auto-cycle active speaker with hover/click takeover"
```

---

## Task 7: Control bar

Adds the bottom control bar. Chat is a real toggle (wired in Task 8); the rest are decorative and hidden from assistive tech.

**Files:**

- Create: `src/components/about/team/CallControls.jsx`
- Modify: `src/components/about/team/TeamCall.jsx`

**Interfaces:**

- Produces: `CallControls` — default export. Props: `chatOpen` (bool), `onToggleChat` (function). Renders the control bar.

- [ ] **Step 1: Write CallControls**

```jsx
// src/components/about/team/CallControls.jsx
import React from "react";

// Bottom control bar. Only Chat is interactive; the other controls are
// decorative set-dressing (aria-hidden, not focusable) so assistive tech
// isn't offered fake buttons.
const ICON = {
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4" />
    </>
  ),
  video: (
    <>
      <rect x="3" y="6" width="12" height="12" rx="2" />
      <path d="M15 10l6-3v10l-6-3" />
    </>
  ),
  hand: (
    <path d="M8 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-.5V6a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-3.5a1.6 1.6 0 0 1 2.6-1.8L8 13" />
  ),
  chat: <path d="M4 5h16v11H8l-4 4z" />,
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 6M18 20a6 6 0 0 0-3-5" />
    </>
  ),
  leave: (
    <path d="M5 4a2 2 0 0 1 2-1.7l2 .3a2 2 0 0 1 1.7 2l-.3 2a2 2 0 0 1-1 1.5 12 12 0 0 0 4.8 4.8 2 2 0 0 1 1.5-1l2-.3a2 2 0 0 1 2 1.7l.3 2A2 2 0 0 1 20 20 16 16 0 0 1 4 4z" />
  ),
};

function Svg({ name, leave }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill={leave ? "#fff" : "none"}
      stroke={leave ? "#fff" : "#dfe6ee"}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={leave ? { transform: "rotate(135deg)" } : undefined}
    >
      {ICON[name]}
    </svg>
  );
}

function DecorCtrl({ name, label }) {
  return (
    <div className="flex flex-col items-center gap-1.5" aria-hidden>
      <span
        className="flex items-center justify-center rounded-full"
        style={{ width: 40, height: 40, background: "#2a2f37" }}
      >
        <Svg name={name} />
      </span>
      <small style={{ fontSize: 9, fontWeight: 500, color: "#8a96a6" }}>
        {label}
      </small>
    </div>
  );
}

function CallControls({ chatOpen, onToggleChat }) {
  return (
    <div
      className="flex items-start justify-center gap-[18px] px-3.5 pb-3.5 pt-3"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      <DecorCtrl name="mic" label="Mute" />
      <DecorCtrl name="video" label="Video" />
      <DecorCtrl name="hand" label="Raise hand" />

      <div className="flex flex-col items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleChat}
          aria-pressed={chatOpen}
          aria-label="Toggle chat"
          className="flex items-center justify-center rounded-full border-0 cursor-pointer"
          style={{
            width: 40,
            height: 40,
            background: chatOpen ? "#3a63d8" : "#2a2f37",
          }}
        >
          <Svg name="chat" />
        </button>
        <small style={{ fontSize: 9, fontWeight: 500, color: "#8a96a6" }}>
          Chat
        </small>
      </div>

      <DecorCtrl name="people" label="People" />

      <div className="flex flex-col items-center gap-1.5" aria-hidden>
        <span
          className="flex items-center justify-center rounded-[20px]"
          style={{ width: 54, height: 40, background: "#e5484d" }}
        >
          <Svg name="leave" leave />
        </span>
        <small style={{ fontSize: 9, fontWeight: 500, color: "#8a96a6" }}>
          Leave
        </small>
      </div>
    </div>
  );
}

export default CallControls;
```

- [ ] **Step 2: Add chat state + render controls in TeamCall**

In `TeamCall.jsx`, add the import and a `chatOpen` state, and render `<CallControls>` after the stage `div`. Add near the other imports:

```jsx
import CallControls from "./CallControls.jsx";
```

Add state inside `TeamCall` next to `view`:

```jsx
const [chatOpen, setChatOpen] = useState(false);
```

Render the controls immediately after the closing tag of the stage `<div className="p-3.5">…</div>` (still inside the call-card div):

```jsx
<CallControls chatOpen={chatOpen} onToggleChat={() => setChatOpen((o) => !o)} />
```

- [ ] **Step 3: Verify in the browser**

Reload and scroll to the team section.
Expected:

- A control bar sits below the stage: Mute, Video, Raise hand, Chat, People, and a red Leave button.
- Clicking **Chat** turns its button blue (active) and back (panel arrives in Task 8; no panel yet, just the toggle state).
- Tabbing through the section reaches the view toggle, the tiles, and the **Chat** button only — not the decorative controls.
- No console errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/about/team/CallControls.jsx src/components/about/team/TeamCall.jsx
git commit -m "feat(team): add call control bar with interactive chat toggle"
```

---

## Task 8: Chat panel

Adds the slide-in chat panel rendering the script. When open in speaker view, the stage reflows (speaker + filmstrip on the left, chat on the right).

**Files:**

- Create: `src/components/about/team/ChatPanel.jsx`
- Modify: `src/components/about/team/TeamCall.jsx`

**Interfaces:**

- Consumes: `CHAT_SCRIPT` (Task 2), `TEAM_ROSTER` (Task 1).
- Produces: `ChatPanel` — default export. Props: `open` (bool), `onClose` (function). Renders nothing when `open` is false.

- [ ] **Step 1: Write ChatPanel**

```jsx
// src/components/about/team/ChatPanel.jsx
import React from "react";
import { CHAT_SCRIPT } from "./chatScript.js";
import { TEAM_ROSTER } from "./teamRoster.js";

const BY_ID = Object.fromEntries(TEAM_ROSTER.map((m) => [m.id, m]));

// Slide-in chat panel showing the scripted (static) conversation. Not live —
// the input is decorative.
function ChatPanel({ open, onClose }) {
  if (!open) return null;
  return (
    <div
      className="flex flex-col"
      style={{
        width: 300,
        background: "#14171d",
        borderLeft: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="flex items-center justify-between px-3.5 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: "#c3ccd8" }}>
          Chat
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="border-0 bg-transparent cursor-pointer"
          style={{ color: "#6b7684", fontSize: 14 }}
        >
          ✕
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-[11px] overflow-hidden px-3.5 py-3">
        {CHAT_SCRIPT.map((line, i) => {
          const author = BY_ID[line.authorId];
          return (
            <div key={i} className="flex gap-2">
              <span
                aria-hidden
                className="flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white"
                style={{
                  width: 24,
                  height: 24,
                  background: author.avatarColor,
                  fontSize: 9,
                }}
              >
                {author.initials}
              </span>
              <div className="min-w-0">
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#c9d3df",
                    marginBottom: 3,
                  }}
                >
                  {author.name}
                </div>
                <div
                  style={{ fontSize: 12, lineHeight: 1.35, color: "#9aa6b4" }}
                >
                  {line.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        aria-hidden
        className="m-3 rounded-lg px-3 py-2.5"
        style={{ background: "#22262e", fontSize: 11, color: "#5c6672" }}
      >
        Message the team…
      </div>
    </div>
  );
}

export default ChatPanel;
```

- [ ] **Step 2: Render ChatPanel + reflow stage in TeamCall**

Add the import:

```jsx
import ChatPanel from "./ChatPanel.jsx";
```

Wrap the stage + chat in a flex row so the panel sits to the right. Replace the stage `<div className="p-3.5">…</div>` block with a row that holds the stage on the left and the panel on the right:

```jsx
<div className="flex">
  <div className="flex-1 p-3.5">
    {view === "grid" ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {TEAM_ROSTER.map((m, i) => (
          <CallTile
            key={m.id}
            member={m}
            variant="grid"
            active={i === activeIndex}
            onSelect={() => selectSpeaker(i)}
          />
        ))}
      </div>
    ) : chatOpen ? (
      /* Speaker + filmstrip when chat is open (needs the width) */
      <div className="flex flex-col gap-2" style={{ height: 300 }}>
        <div className="flex-1">
          <CallTile member={active} variant="speaker" active />
        </div>
        <div className="flex gap-1.5" style={{ height: 46 }}>
          {others.map((m) => {
            const realIndex = TEAM_ROSTER.findIndex((x) => x.id === m.id);
            return (
              <div key={m.id} className="flex-1">
                <CallTile
                  member={m}
                  variant="filmstrip"
                  onSelect={() => selectSpeaker(realIndex)}
                />
              </div>
            );
          })}
        </div>
      </div>
    ) : (
      /* Speaker + side grid when chat is closed */
      <div className="flex gap-2.5" style={{ height: 300 }}>
        <div className="w-[58%]">
          <CallTile member={active} variant="speaker" active />
        </div>
        <div className="grid w-[42%] grid-cols-2 gap-2 content-start">
          {others.map((m) => {
            const realIndex = TEAM_ROSTER.findIndex((x) => x.id === m.id);
            return (
              <CallTile
                key={m.id}
                member={m}
                variant="grid"
                onSelect={() => selectSpeaker(realIndex)}
              />
            );
          })}
        </div>
      </div>
    )}
  </div>

  <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
</div>
```

- [ ] **Step 3: Verify in the browser**

Reload and scroll to the team section.
Expected:

- Clicking **Chat** slides in a right-hand panel with the scripted conversation (names + initials avatars + lines). In speaker view the left side collapses to a big speaker + a thin filmstrip so the chat has room.
- The panel's **✕** and the Chat control both close it.
- In grid view, opening chat keeps the gallery on the left and the panel on the right.
- No console errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/about/team/ChatPanel.jsx src/components/about/team/TeamCall.jsx
git commit -m "feat(team): add slide-in chat panel with scripted conversation"
```

---

## Task 9: Responsive / mobile

On small screens, force speaker-view-only auto-cycle: hide the view toggle and the side grid, show just the big speaker; the chat panel becomes a full-width overlay.

**Files:**

- Modify: `src/components/about/team/TeamCall.jsx`

**Interfaces:**

- Produces (internal): `TeamCall` gains an `isMobile` flag from `matchMedia("(max-width: 1023px)")` (same breakpoint the tour uses).

- [ ] **Step 1: Add isMobile and apply it**

Add the effect + state (place with the other hooks in `TeamCall`):

```jsx
const [isMobile, setIsMobile] = useState(false);
React.useEffect(() => {
  const mq = window.matchMedia("(max-width: 1023px)");
  const compute = () => setIsMobile(mq.matches);
  compute();
  mq.addEventListener("change", compute);
  return () => mq.removeEventListener("change", compute);
}, []);
```

Force speaker view on mobile by deriving the effective view (add just before the `return`):

```jsx
const effectiveView = isMobile ? "speaker" : view;
```

Then in JSX: hide the toggle on mobile, use `effectiveView` for the branch, and make the chat panel an overlay on mobile.

Replace the top bar so the toggle is hidden on mobile:

```jsx
<div
  className="flex items-center justify-end px-3 py-2.5"
  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", minHeight: 44 }}
>
  {!isMobile && <ViewToggle view={view} onChange={setView} />}
</div>
```

Change the stage branch condition from `view === "grid"` to `effectiveView === "grid"`.

On mobile, when chat is open, render the panel as a fixed full-width overlay instead of a side rail. Replace the `<ChatPanel … />` line with:

```jsx
{
  isMobile ? (
    chatOpen && (
      <div
        className="fixed inset-0 z-50 flex"
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={() => setChatOpen(false)}
      >
        <div className="ml-auto h-full" onClick={(e) => e.stopPropagation()}>
          <ChatPanel open onClose={() => setChatOpen(false)} />
        </div>
      </div>
    )
  ) : (
    <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
  );
}
```

Also make the speaker-view side grid stack under the speaker on narrow widths: change the closed-chat speaker branch wrapper `className="flex gap-2.5"` to `className="flex flex-col sm:flex-row gap-2.5"` and the two children widths from `w-[58%]` / `w-[42%]` to `w-full sm:w-[58%]` / `w-full sm:w-[42%]`.

- [ ] **Step 2: Verify in the browser**

Reload `http://localhost:4321/about`. Resize the window narrow (< 1024px) or use device emulation (e.g. 390×844).
Expected:

- The **view toggle disappears**; only the big auto-cycling speaker shows (no side grid).
- Tapping **Chat** brings the conversation up as a full-width overlay with a dimmed backdrop; tapping the backdrop or ✕ closes it.
- Back at desktop width, the toggle and both views return.
- No console errors; no horizontal page scroll introduced.

- [ ] **Step 3: Commit**

```bash
git add src/components/about/team/TeamCall.jsx
git commit -m "feat(team): mobile — speaker-only view and full-width chat overlay"
```

---

## Task 10: Accessibility + entrance polish

Final pass: a section heading/lede for context and screen-reader framing, an entrance animation matching the rest of the page, focus-visible styling, and confirmation that the decorative controls are hidden.

**Files:**

- Modify: `src/components/about/team/TeamCall.jsx`

**Interfaces:**

- Consumes: `useEntrance` from `../../../hooks/useEntrance.js`.

- [ ] **Step 1: Add heading + entrance + focus styles**

Add the import:

```jsx
import { useEntrance } from "../../../hooks/useEntrance.js";
```

Inside `TeamCall`, add the entrance ref:

```jsx
const headerEntrance = useEntrance();
```

Add a header above the call card (inside `max-w-[980px]`, before the call-card div). This gives the section a plain-text identity so it reads as a team list even without the animation:

```jsx
<header
  ref={headerEntrance.ref}
  style={headerEntrance.style}
  className="mb-8 max-w-2xl"
>
  <h2 className="font-harmony text-text-contrast text-4xl md:text-5xl lg:text-6xl leading-[1.05]">
    The team behind Audacity 4
  </h2>
  <p className="mt-4 text-text-contrast/70 text-base md:text-lg">
    We are fully remote, so a video call is how we see each other most days. Say
    hello.
  </p>
</header>
```

(The heading/lede copy is a placeholder for a later copy pass — keep it factual, no "Zoom".)

Add a focus-visible ring to tiles and controls via a small scoped `<style>` at the end of the returned markup (before the closing `</section>`):

```jsx
<style>{`
          .about-section--team .team-tile:focus-visible,
          .about-section--team button:focus-visible {
            outline: 2px solid #7c9cff;
            outline-offset: 2px;
          }
        `}</style>
```

- [ ] **Step 2: Verify in the browser**

Reload and scroll to the team section.
Expected:

- A heading + lede sit above the call card and fade/slide in once on scroll (matching other sections).
- Tabbing shows a clear focus ring on the toggle, tiles, and Chat button; the decorative controls are skipped.
- With a screen reader (macOS VoiceOver: Cmd+F5), the section reads as a heading + a set of buttons labelled with teammate names; mute/video/hand/people/leave are not announced as controls.
- No console errors.

- [ ] **Step 3: Run the full unit-test suite**

Run: `bun test src`
Expected: PASS — including the three team modules (`teamRoster`, `chatScript`, `cycle`).

- [ ] **Step 4: Commit**

```bash
git add src/components/about/team/TeamCall.jsx
git commit -m "feat(team): section heading, entrance, and focus-visible states"
```

---

## Self-Review Notes

- **Spec coverage:** placement (T4), speaker+grid views & toggle (T5), auto-cycle + takeover (T6), reduced-motion (T6), control bar with decorative/interactive split (T7), chat panel + reflow (T8), mobile speaker-only + overlay (T9), roster role labels & placeholder photos (T1/T4), chat script in own module + integrity test (T2), accessibility/keyboard/alt/heading (T10), no-Zoom constraint (global + T2 test). All spec sections map to a task.
- **Photos swap** is data-only via `teamRoster.js` (`photo` field), as the spec requires — no task needed beyond dropping files in `/public` and editing the roster.
- **Interstitial/background:** resolved by sharing the CTA's `rgb(8, 6, 28)` so the existing `#120927 → rgb(8,6,28)` interstitial bridges in with no new interstitial (T4).
