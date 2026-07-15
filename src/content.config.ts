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

export const collections = {
  blog: blogCollection,
};
