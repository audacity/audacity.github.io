import { expect, test } from "bun:test";
import { parseMdx } from "../mdx/pipeline";
import { mdastToDoc } from "./mdastToDoc";
import { docToSource } from "./docToMdast";
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
