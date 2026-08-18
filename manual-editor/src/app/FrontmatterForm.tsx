import {
  collapseNewlines,
  type FrontmatterData,
} from "../adapter/frontmatterSerialize";
import { DEFAULT_STREAM, STREAMS } from "./streams";

/** `<datalist>` id backing the Section field's autocomplete (see the input below). */
const SECTION_LIST_ID = "frontmatter-form-sections";

/**
 * Controlled form for a manual page's frontmatter metadata (title,
 * description, stream, section, section/page order, draft flag). Mounted above the
 * toolbar/editor in `Editor.tsx`, which owns the `FrontmatterData` state
 * this reads and writes via `onChange`; the resulting
 * `serializeFrontmatter(data)` string is what D6's save path substitutes for
 * the page's original raw frontmatter.
 */
export function FrontmatterForm({
  data,
  sections,
  onChange,
}: {
  data: FrontmatterData;
  /** Existing section names across the manual, offered as autocomplete. */
  sections: string[];
  onChange: (next: FrontmatterData) => void;
}) {
  function set<K extends keyof FrontmatterData>(
    key: K,
    value: FrontmatterData[K],
  ) {
    onChange({ ...data, [key]: value });
  }

  /** Reads a `<number>` input, treating an emptied field as "unset" (falls back to the schema default at serialize time) rather than `NaN`. */
  function parseNumberInput(raw: string): number | undefined {
    if (raw.trim() === "") return undefined;
    const n = Number(raw);
    return Number.isNaN(n) ? undefined : n;
  }

  return (
    <div className="frontmatter-form" data-testid="frontmatter-form">
      <div className="frontmatter-form__field">
        <label htmlFor="frontmatter-title">Title</label>
        <input
          id="frontmatter-title"
          type="text"
          required
          value={data.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </div>

      <div className="frontmatter-form__field">
        <label htmlFor="frontmatter-description">Description</label>
        <textarea
          id="frontmatter-description"
          rows={2}
          value={data.description ?? ""}
          onChange={(e) => set("description", collapseNewlines(e.target.value))}
        />
      </div>

      <div className="frontmatter-form__field">
        <label htmlFor="frontmatter-stream">Stream</label>
        {/*
            Sits above Section because it's the broader decision: which of the
            manual's three parts the page belongs to. A select rather than free
            text — unlike Section, the values are fixed by the content schema.
          */}
        <select
          id="frontmatter-stream"
          value={data.stream ?? DEFAULT_STREAM}
          onChange={(e) => set("stream", e.target.value)}
        >
          {STREAMS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="frontmatter-form__field">
        <label htmlFor="frontmatter-section">Section</label>
        <input
          id="frontmatter-section"
          type="text"
          required
          list={SECTION_LIST_ID}
          value={data.section}
          onChange={(e) => set("section", e.target.value)}
        />
        <datalist id={SECTION_LIST_ID}>
          {sections.map((section) => (
            <option key={section} value={section} />
          ))}
        </datalist>
      </div>

      <div className="frontmatter-form__row">
        <div className="frontmatter-form__field">
          <label htmlFor="frontmatter-section-order">Section order</label>
          <input
            id="frontmatter-section-order"
            type="number"
            value={data.sectionOrder ?? ""}
            onChange={(e) =>
              set("sectionOrder", parseNumberInput(e.target.value))
            }
          />
        </div>

        <div className="frontmatter-form__field">
          <label htmlFor="frontmatter-order">Order</label>
          <input
            id="frontmatter-order"
            type="number"
            value={data.order ?? ""}
            onChange={(e) => set("order", parseNumberInput(e.target.value))}
          />
        </div>

        <div className="frontmatter-form__field frontmatter-form__field--checkbox">
          <label htmlFor="frontmatter-draft">
            <input
              id="frontmatter-draft"
              type="checkbox"
              checked={data.draft ?? false}
              onChange={(e) => set("draft", e.target.checked)}
            />
            Draft
          </label>
        </div>
      </div>
    </div>
  );
}

export default FrontmatterForm;
