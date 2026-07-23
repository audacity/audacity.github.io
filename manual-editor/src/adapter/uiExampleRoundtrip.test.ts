import { expect, test } from "bun:test";
import { getSchema } from "@tiptap/core";
import { DOMParser, DOMSerializer } from "@tiptap/pm/model";
import { parseMdx } from "../mdx/pipeline";
import { mdastToDoc } from "./mdastToDoc";
import { docToSource } from "./docToMdast";
import { buildExtensions } from "./schema";
import type { PMNodeJSON } from "./mdastToDoc";

async function roundTrip(src: string): Promise<string> {
  const { doc } = mdastToDoc(parseMdx(src));
  return docToSource(doc, null);
}

function firstNode(src: string): PMNodeJSON {
  const { doc } = mdastToDoc(parseMdx(src));
  return doc.content![0]!;
}

test("static UIExample maps to a uiExample node and round-trips byte-stable", async () => {
  const src = '<UIExample component="knob" variant="default" />\n';
  const node = firstNode(src);
  expect(node.type).toBe("uiExample");
  expect(node.attrs).toEqual({
    component: "knob",
    variant: "default",
    interactive: false,
  });
  expect(await roundTrip(src)).toBe(src);
});

test("interactive UIExample round-trips with bare interactive and client:load", async () => {
  const src =
    '<UIExample component="button" variant="primary" interactive client:load />\n';
  const node = firstNode(src);
  expect(node.attrs?.interactive).toBe(true);
  expect(await roundTrip(src)).toBe(src);
});

test("unknown component id routes to preserved and survives verbatim", async () => {
  const src = '<UIExample component="mystery" variant="default" />\n';
  expect(firstNode(src).type).toBe("preserved");
  expect(await roundTrip(src)).toBe(src);
});

test("unknown variant id routes to preserved and survives verbatim", async () => {
  const src = '<UIExample component="knob" variant="mystery" />\n';
  expect(firstNode(src).type).toBe("preserved");
  expect(await roundTrip(src)).toBe(src);
});

test("extra attributes route to preserved so nothing is silently dropped", async () => {
  const src =
    '<UIExample component="knob" variant="default" className="x" />\n';
  expect(firstNode(src).type).toBe("preserved");
  expect(await roundTrip(src)).toBe(src);
});

test("children route to preserved (UIExample is self-closing only)", async () => {
  const src = '<UIExample component="knob" variant="default">hi</UIExample>\n';
  expect(firstNode(src).type).toBe("preserved");
});

test("uiExample attrs survive a DOM serialize/re-parse round-trip (clipboard copy/paste)", () => {
  // Simulates what ProseMirror does on copy/paste: serialize the node to a
  // DOM fragment, then re-parse that fragment back into a node. Before the
  // fix, `interactive: true` came back as the *string* "true" because the
  // node relied on TipTap's default attribute handling instead of explicit
  // parseHTML/renderHTML, which downstream `=== true` checks read as false.
  const schema = getSchema(buildExtensions());
  const node = schema.nodes.uiExample!.create({
    component: "knob",
    variant: "default",
    interactive: true,
  });

  const dom = DOMSerializer.fromSchema(schema).serializeNode(
    node,
  ) as HTMLElement;
  const wrapper = document.createElement("div");
  wrapper.appendChild(dom);

  const parsedDoc = DOMParser.fromSchema(schema).parse(wrapper);
  const reparsed = parsedDoc.content.firstChild!;

  expect(reparsed.type.name).toBe("uiExample");
  expect(reparsed.attrs.component).toBe("knob");
  expect(reparsed.attrs.variant).toBe("default");
  expect(reparsed.attrs.interactive).toBe(true);
  expect(typeof reparsed.attrs.interactive).toBe("boolean");
});

// Amendment 4 (spec): hand-authored non-canonical forms normalize on save.
test("reordered attributes parse fine and normalize to canonical attribute order on save", async () => {
  const src = '<UIExample variant="default" component="knob" />\n';
  const node = firstNode(src);
  expect(node.type).toBe("uiExample");
  expect(await roundTrip(src)).toBe(
    '<UIExample component="knob" variant="default" />\n',
  );
});

// Amendment 4 (spec): hand-authored non-canonical forms normalize on save.
test('quoted interactive="true" parses to a boolean and normalizes to bare interactive + client:load on save', async () => {
  const src =
    '<UIExample component="knob" variant="default" interactive="true" />\n';
  const node = firstNode(src);
  expect(node.attrs?.interactive).toBe(true);
  expect(await roundTrip(src)).toBe(
    '<UIExample component="knob" variant="default" interactive client:load />\n',
  );
});
