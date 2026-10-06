// src/content.config.ts — the two content sections (owner decision 2026-10-07; rules in src/lib/posts.ts).
//
//   articles  src/content/articles/<zh-Hant|en>/<slug>.md  SEO articles credited to the site (never an author field)
//   views     src/content/views/<zh-Hant|en>/<slug>.md     the owner's own views, credited to him
//
// The file name is the slug (validated: a bad name, folder or locale fails the build). The schemas are strict, so an
// unknown field (an `author`, a typo) fails the build instead of being ignored. How to write a post:
// src/content/_templates/ (outside both collection folders, so never built).

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { postIdFromPath, type PostSection } from './lib/posts.ts';

/** A calendar day: YAML `2026-10-07` (already a Date) or the quoted string form. */
const day = z.union([z.date(), z.iso.date().transform((s) => new Date(`${s}T00:00:00Z`))]);

const common = {
  title: z.string().trim().min(1),
  /** ≤ 160 characters recommended (check-dist warns above that) */
  description: z.string().trim().min(1),
  date: day,
  updated: day.optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
  /** drafts never build: no page, feed, sitemap entry, llms.txt line or nav link */
  draft: z.boolean().default(false),
};

const updatedAfterDate = (d: { date: Date; updated?: Date | undefined }): boolean => !d.updated || d.updated >= d.date;
const UPDATED_MSG = { message: '`updated` is earlier than `date`' };

const loader = (section: PostSection) =>
  glob({
    pattern: '**/*.md',
    base: `./src/content/${section}`,
    generateId: ({ entry }) => postIdFromPath(entry, section),
  });

const articles = defineCollection({
  loader: loader('articles'),
  schema: z
    .strictObject({
      ...common,
      /** rendered as the 來源 / Sources list at the end of the article */
      sources: z.array(z.strictObject({ title: z.string().trim().min(1), url: z.url({ protocol: /^https?$/ }) })).default([]),
    })
    .refine(updatedAfterDate, UPDATED_MSG),
});

const views = defineCollection({
  loader: loader('views'),
  schema: z.strictObject(common).refine(updatedAfterDate, UPDATED_MSG),
});

export const collections = { articles, views };
