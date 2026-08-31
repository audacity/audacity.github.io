import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blogCollection = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      author: z.enum([
        "Dawson Custons-Cole",
        "Leo Wattenberg",
        "Martin Keary",
        "Audacity Team",
      ]),
      cover: image(),
      coverAlt: z.string(),
      publishDate: z.date(),
      draft: z.boolean(),
    }),
});

/*
  The three documentation modes. A page's stream decides which sidebar it
  appears in, not where its file lives — re-filing a page is a one-line
  frontmatter change rather than a move, so the taxonomy stays cheap to
  revise.

  Defaults to "reference" so every page written before streams existed keeps
  its current home without being touched.
*/
export const MANUAL_STREAMS = [
  "getting-started",
  "how-to",
  "reference",
] as const;

/*
  Carried over from src/content/config.ts, which main removed when it moved to
  Astro 6's content layer. Same schema, declared with a glob loader instead of
  `type: "content"` — .mdx included, since the manual pages that embed live
  components are authored as MDX.
*/
const manualCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/manual" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    section: z.string(),
    sectionOrder: z.number().default(99),
    order: z.number().default(99),
    draft: z.boolean().default(false),
    /* Marks a page as its section's index: the sidebar heading links to it
       and it no longer renders as a row. For sections whose pages don't all
       nest under one path, where the single-root collapse can't apply. */
    sectionIndex: z.boolean().default(false),
    stream: z.enum(MANUAL_STREAMS).default("reference"),
  }),
});

export const collections = {
  blog: blogCollection,
  manual: manualCollection,
};
