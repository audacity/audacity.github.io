// 1. Import utilities from `astro:content`
import { z, defineCollection } from 'astro:content';

// 2. Define a `type` and `schema` for each collection
const blogCollection = defineCollection({
  type: 'content', // v2.5.0 and later
  schema: ({image}) => z.object({
    title: z.string(),
    description: z.string(),
    author: z.enum(["Dawson Custons-Cole", "Leo Wattenberg", "Martin Keary", "Audacity Team"]),
    cover: image(),
    coverAlt: z.string(),
    publishDate: z.date(),
    draft: z.boolean()
  }),
});

// 3. Export a single `collections` object to register your collection(s)
export const collections = {
  'blog': blogCollection,
};