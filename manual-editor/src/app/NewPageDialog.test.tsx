import { expect, test } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";
import { NewPageDialog } from "./NewPageDialog";
import type { ManualPageMeta } from "../backend/types";

const pages: ManualPageMeta[] = [
  {
    slug: "basics/installing-ffmpeg",
    path: "src/content/manual/basics/installing-ffmpeg.mdx",
    title: "Installing FFmpeg",
    section: "Basics",
    sectionOrder: 0,
    order: 3,
    draft: false,
    hasDraft: false,
  },
  {
    slug: "audio-editing/trimming",
    path: "src/content/manual/audio-editing/trimming.mdx",
    title: "Trimming Audio",
    section: "Audio Editing",
    sectionOrder: 1,
    order: 1,
    draft: false,
    hasDraft: false,
  },
];

test("the path preview updates as the title (and section) change", () => {
  render(
    <NewPageDialog pages={pages} onCreate={() => {}} onCancel={() => {}} />,
  );

  fireEvent.change(screen.getByLabelText("Section"), {
    target: { value: "Basics" },
  });
  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "My New Page" },
  });

  expect(screen.getByTestId("new-page-path-preview").textContent).toBe(
    "src/content/manual/basics/my-new-page.mdx",
  );

  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Another Page" },
  });
  expect(screen.getByTestId("new-page-path-preview").textContent).toBe(
    "src/content/manual/basics/another-page.mdx",
  );
});

test("submitting with a path that collides with an existing page shows an error and does not call onCreate", () => {
  let created: unknown = null;
  render(
    <NewPageDialog
      pages={pages}
      onCreate={(result) => {
        created = result;
      }}
      onCancel={() => {}}
    />,
  );

  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Installing FFmpeg" },
  });
  fireEvent.change(screen.getByLabelText("Section"), {
    target: { value: "Basics" },
  });

  fireEvent.click(screen.getByRole("button", { name: "Create" }));

  expect(screen.getByTestId("new-page-error").textContent).toContain(
    "src/content/manual/basics/installing-ffmpeg.mdx",
  );
  expect(created).toBeNull();
});

const parent: ManualPageMeta = {
  slug: "manual-index/project-management-menu/home",
  path: "src/content/manual/manual-index/project-management-menu/home.mdx",
  title: "Home",
  section: "Project Management Menu",
  sectionOrder: 5,
  order: 2,
  draft: false,
  hasDraft: false,
};

test("with a parent, pre-fills location + section and previews a nested path", () => {
  render(
    <NewPageDialog
      pages={[]}
      parent={parent}
      onCreate={() => {}}
      onCancel={() => {}}
    />,
  );

  expect(screen.getByText(/sub-page of Home/i)).toBeDefined();

  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Cloud Backups" },
  });

  expect(screen.getByTestId("new-page-path-preview").textContent).toBe(
    "src/content/manual/manual-index/project-management-menu/home/cloud-backups.mdx",
  );
});

test("without a parent, heading is the plain New page and location is empty", () => {
  render(<NewPageDialog pages={[]} onCreate={() => {}} onCancel={() => {}} />);

  expect(screen.getByText(/^New page$/i)).toBeDefined();
  const loc = document.getElementById("new-page-location") as HTMLInputElement;
  expect(loc.value).toBe("");
});

test("a valid submit calls onCreate with the composed path and frontmatter containing title/section", () => {
  let created: { path: string; frontmatter: string } | null = null;
  render(
    <NewPageDialog
      pages={pages}
      onCreate={(result) => {
        created = result;
      }}
      onCancel={() => {}}
    />,
  );

  fireEvent.change(screen.getByLabelText("Title"), {
    target: { value: "Recording Voiceover" },
  });
  fireEvent.change(screen.getByLabelText("Section"), {
    target: { value: "Basics" },
  });

  fireEvent.click(screen.getByRole("button", { name: "Create" }));

  expect(created).not.toBeNull();
  expect(created!.path).toBe(
    "src/content/manual/basics/recording-voiceover.mdx",
  );
  expect(created!.frontmatter).toContain("title: Recording Voiceover");
  expect(created!.frontmatter).toContain("section: Basics");
});
