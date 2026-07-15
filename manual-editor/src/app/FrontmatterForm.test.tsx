import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { FrontmatterForm } from "./FrontmatterForm";
import type { FrontmatterData } from "../adapter/frontmatterSerialize";

const baseData: FrontmatterData = {
  title: "Installing FFmpeg",
  description: "How to install FFmpeg.",
  section: "Basics",
  sectionOrder: 1,
  order: 2,
  draft: false,
};

test("mounts with data-testid and labeled fields populated from data", () => {
  render(
    <FrontmatterForm
      data={baseData}
      sections={["Basics", "Advanced"]}
      onChange={() => {}}
    />,
  );
  expect(screen.getByTestId("frontmatter-form")).toBeDefined();
  expect(screen.getByLabelText("Title")).toHaveProperty(
    "value",
    "Installing FFmpeg",
  );
  expect(screen.getByLabelText("Description")).toHaveProperty(
    "value",
    "How to install FFmpeg.",
  );
  expect(screen.getByLabelText("Section")).toHaveProperty("value", "Basics");
  expect(screen.getByLabelText("Section order")).toHaveProperty("value", "1");
  expect(screen.getByLabelText("Order")).toHaveProperty("value", "2");
  expect(screen.getByLabelText("Draft")).toHaveProperty("checked", false);
});

test("editing the title input calls onChange with the new title and the rest of the data unchanged", () => {
  let latest: FrontmatterData | null = null;
  render(
    <FrontmatterForm
      data={baseData}
      sections={[]}
      onChange={(next) => {
        latest = next;
      }}
    />,
  );
  const title = screen.getByLabelText("Title");
  fireEvent.change(title, { target: { value: "Installing FFmpeg on macOS" } });

  expect(latest).not.toBeNull();
  expect(latest!).toEqual({ ...baseData, title: "Installing FFmpeg on macOS" });
});

test("the section input's datalist contains the passed sections", () => {
  const { container } = render(
    <FrontmatterForm
      data={baseData}
      sections={["Basics", "Advanced", "Effects"]}
      onChange={() => {}}
    />,
  );
  const options = Array.from(container.querySelectorAll("datalist option")).map(
    (o) => o.getAttribute("value"),
  );
  expect(options).toEqual(["Basics", "Advanced", "Effects"]);
});

test("editing section, order fields, and the draft checkbox calls onChange with coerced values", () => {
  let latest: FrontmatterData = baseData;
  const handleChange = (next: FrontmatterData) => {
    latest = next;
  };
  const { rerender } = render(
    <FrontmatterForm
      data={latest}
      sections={["Basics"]}
      onChange={handleChange}
    />,
  );

  fireEvent.change(screen.getByLabelText("Section"), {
    target: { value: "Advanced" },
  });
  expect(latest.section).toBe("Advanced");
  rerender(
    <FrontmatterForm
      data={latest}
      sections={["Basics"]}
      onChange={handleChange}
    />,
  );

  fireEvent.change(screen.getByLabelText("Order"), { target: { value: "5" } });
  expect(latest.order).toBe(5);
  rerender(
    <FrontmatterForm
      data={latest}
      sections={["Basics"]}
      onChange={handleChange}
    />,
  );

  fireEvent.click(screen.getByLabelText("Draft"));
  expect(latest.draft).toBe(true);
});
