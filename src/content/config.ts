// 1. Import utilities from `astro:content`
import { z, defineCollection } from "astro:content";

// 2. Define a `type` and `schema` for each collection
const blogCollection = defineCollection({
  type: "content", // v2.5.0 and later
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

const manualCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    section: z.string(),
    sectionOrder: z.number().default(99),
    order: z.number().default(99),
    draft: z.boolean().default(false),
    stream: z.enum(MANUAL_STREAMS).default("reference"),
  }),
});

// 3. Export a single `collections` object to register your collection(s)
export const collections = {
  blog: blogCollection,
  manual: manualCollection,
};
