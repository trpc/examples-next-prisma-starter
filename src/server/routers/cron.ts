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

      const results = await Promise.allSettled(
        sources.map(async (source) => {
          const fn = SOURCES[source.slug];
          if (!fn) {
            throw new Error(`No such source "${source.slug}"`);
          }
          const items = await fn(source);
          await bulkUpsertJobs({ source, items });
        }),
      );

      const fails = results.flatMap((result, index) =>
        result.status === 'rejected'
          ? [
              {
                reason: result.reason,
                source: sources[index].slug,
              },
            ]
          : [],
      );

      const algolia = await alogliaReindex();

      return { fails, algolia };
    },
  });
