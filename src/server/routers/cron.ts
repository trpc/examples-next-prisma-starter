/**
 *
 * This is an example router, you can delete this file and then update `../pages/api/trpc/[trpc].tsx`
 */

import { createRouter } from 'server/trpc';
import { alogliaReindex } from 'server/utils/algolia';
import { bulkUpsertJobs } from 'server/crawlers/bulkUpsert';
import { SOURCES } from 'server/crawlers/sources';
import { z } from 'zod';

export const cronRouter = createRouter()
  .query('reindex', {
    async resolve() {
      return await alogliaReindex();
    },
  })
  .query('pull', {
    input: z.string(),
    async resolve({ ctx, input }) {
      const source = await ctx.prisma.source.findUnique({
        where: { slug: input },
      });
      if (!source || !SOURCES[source.slug]) {
        throw new Error(`No such source "${input}"`);
      }
      console.log('🏃‍♂️', source.slug);
      const fn = SOURCES[source.slug];
      if (!fn) {
        throw new Error(`No such source "${source.slug}"`);
      }
      console.time(`${source.slug} crawling`);
      const items = await fn(source);
      console.timeEnd(`${source.slug} crawling`);

      console.time(`${source.slug} upsert ${items.length} items`);
      await bulkUpsertJobs({ source, items });
      console.timeEnd(`${source.slug} upsert ${items.length} items`);
      console.time('reindexing');
      const algolia = await alogliaReindex();
      console.timeEnd('reindexing');

      return { algolia, items: items.length };
    },
  });
