import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { schemas } from './lib/schema.mjs';
export const collections = {
 works: defineCollection({loader:glob({pattern:'**/*.md',base:'./src/content/works'}),schema:schemas.works}),
 achievements: defineCollection({loader:glob({pattern:'**/*.md',base:'./src/content/achievements'}),schema:schemas.achievements}),
 news: defineCollection({loader:glob({pattern:'**/*.md',base:'./src/content/news'}),schema:schemas.news})
};
