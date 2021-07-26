/**
 *
 * This is an example router, you can delete this file and then update `../pages/api/trpc/[trpc].tsx`
 */

import { createRouter } from 'server/trpc';
import { alogliaReindex } from 'server/utils/algolia';
import { bulkUpsertJobs } from 'server/crawlers/bulkUpsert';
import { SOURCES } from 'server/crawlers/sources';

export const cronRouter = createRouter()
  .query('reindex', {
    async resolve() {
      return await alogliaReindex();
    },
  })
  .query('pull', {
    async resolve({ ctx }) {
      const sources = await ctx.prisma.source.findMany();
      const errors: {
        source: string;
        error: unknown;
      }[] = [];
      for (const source of sources) {
        console.log('🏃‍♂️', source.slug);
        const fn = SOURCES[source.slug];
        if (!fn) {
          throw new Error(`No such source "${source.slug}"`);
        }
        try {
          console.time(`${source.slug} crawling`);
          const items = await fn(source);
          console.timeEnd(`${source.slug} crawling`);

          console.time(`${source.slug} upsert ${items.length} items`);
          await bulkUpsertJobs({ source, items });
          console.timeEnd(`${source.slug} upsert ${items.length} items`);
        } catch (error) {
          errors.push({ error, source: source.slug });
        }
      }
      console.time('reindexing');
      const algolia = await alogliaReindex();
      console.timeEnd('reindexing');

      return { errors, algolia };
    },
  });
