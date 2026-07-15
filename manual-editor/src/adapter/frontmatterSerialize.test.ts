import { expect, test } from "bun:test";
import { parseFrontmatter } from "../backend/frontmatter";
import {
  serializeFrontmatter,
  type FrontmatterData,
} from "./frontmatterSerialize";

/** Round-trips `data` through `serializeFrontmatter` -> `parseFrontmatter`. */
function roundtrip(data: FrontmatterData) {
  const source = `${serializeFrontmatter(data)}\nBody\n`;
  return parseFrontmatter(source);
}

test("emits keys in fixed order: title, description, section, sectionOrder, order, draft", () => {
  const yaml = serializeFrontmatter({
    title: "Installing FFmpeg",
    description: "How to install FFmpeg.",
    section: "Basics",
    sectionOrder: 1,
    order: 2,
    draft: true,
  });
  expect(yaml).toBe(
    [
      "---",
      "title: Installing FFmpeg",
      "description: How to install FFmpeg.",
      "section: Basics",
      "sectionOrder: 1",
      "order: 2",
      "draft: true",
      "---",
      "",
    ].join("\n"),
  );
});

test("round-trips a full record through parseFrontmatter", () => {
  const data: FrontmatterData = {
    title: "Installing FFmpeg",
    description: "How to install FFmpeg.",
    section: "Basics",
    sectionOrder: 1,
    order: 2,
    draft: true,
  };
  const { data: parsed, body } = roundtrip(data);
  expect(parsed).toEqual({ ...data });
  expect(body).toBe("Body\n");
});

test("omits description entirely when empty/undefined", () => {
  const yaml = serializeFrontmatter({ title: "T", section: "S" });
  expect(yaml).not.toContain("description");
  const { data } = roundtrip({ title: "T", section: "S" });
  expect(data.description).toBeUndefined();
});

test("omits sectionOrder/order when equal to the schema default (99)", () => {
  const yaml = serializeFrontmatter({
    title: "T",
    section: "S",
    sectionOrder: 99,
    order: 99,
  });
  expect(yaml).not.toContain("sectionOrder");
  expect(yaml).not.toContain("order:");
  const { data } = roundtrip({
    title: "T",
    section: "S",
    sectionOrder: 99,
    order: 99,
  });
  expect(data.sectionOrder).toBeUndefined();
  expect(data.order).toBeUndefined();
});

test("emits sectionOrder/order as bare unquoted numbers when non-default", () => {
  const yaml = serializeFrontmatter({
    title: "T",
    section: "S",
    sectionOrder: 4,
    order: 0,
  });
  expect(yaml).toContain("sectionOrder: 4");
  expect(yaml).toContain("order: 0");
  const { data } = roundtrip({
    title: "T",
    section: "S",
    sectionOrder: 4,
    order: 0,
  });
  expect(data.sectionOrder).toBe(4);
  expect(data.order).toBe(0);
});

test("omits draft when false/undefined, emits `draft: true` only when true", () => {
  const yamlFalse = serializeFrontmatter({
    title: "T",
    section: "S",
    draft: false,
  });
  expect(yamlFalse).not.toContain("draft");
  const yamlTrue = serializeFrontmatter({
    title: "T",
    section: "S",
    draft: true,
  });
  expect(yamlTrue).toContain("draft: true");
  const { data } = roundtrip({ title: "T", section: "S", draft: true });
  expect(data.draft).toBe(true);
});

test("quotes a title containing a colon-space, and round-trips it", () => {
  const data: FrontmatterData = {
    title: "Recording: getting started",
    section: "Basics",
  };
  const yaml = serializeFrontmatter(data);
  expect(yaml).toContain('title: "Recording: getting started"');
  const { data: parsed } = roundtrip(data);
  expect(parsed.title).toBe("Recording: getting started");
});

test("quotes and escapes a description containing embedded double quotes, and round-trips it", () => {
  const data: FrontmatterData = {
    title: "T",
    section: "S",
    // Leading `"` forces quoting; the embedded quote must be escaped so the
    // serialized line stays valid YAML and unescapes back to the original.
    description: '"Quoted" term needs escaping inside the value',
  };
  const yaml = serializeFrontmatter(data);
  expect(yaml).toContain(
    'description: "\\"Quoted\\" term needs escaping inside the value"',
  );
  const { data: parsed } = roundtrip(data);
  expect(parsed.description).toBe(data.description);
});

test("does not quote an ordinary description containing an embedded quote mid-string", () => {
  // Not at the start, and no colon-space/other hazard — a plain YAML scalar
  // handles a bare `"` mid-string fine, so no quoting is needed here.
  const data: FrontmatterData = {
    title: "T",
    section: "S",
    description: 'He said "hi" to me',
  };
  const yaml = serializeFrontmatter(data);
  expect(yaml).toContain('description: He said "hi" to me');
  const { data: parsed } = roundtrip(data);
  expect(parsed.description).toBe(data.description);
});

test("quotes a value that looks like a number or boolean so it stays a string", () => {
  const data: FrontmatterData = { title: "42", section: "true" };
  const yaml = serializeFrontmatter(data);
  expect(yaml).toContain('title: "42"');
  expect(yaml).toContain('section: "true"');
  const { data: parsed } = roundtrip(data);
  expect(parsed.title).toBe("42");
  expect(parsed.section).toBe("true");
});

test("leaves an ordinary title/section unquoted", () => {
  const yaml = serializeFrontmatter({
    title: "Basics",
    section: "Getting Started",
  });
  expect(yaml).toContain("title: Basics");
  expect(yaml).toContain("section: Getting Started");
});
