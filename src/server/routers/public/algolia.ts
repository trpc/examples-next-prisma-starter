/**
 * This file contains the root router of your tRPC-backend
 */
import { algoliaIndex, AlgoliaJob } from 'server/utils/algolia';
import { z } from 'zod';
import { createRouter } from '../../trpc';

export const algoliaRouter = createRouter()
  //
  .query('basic', {
    input: z
      .object({
        query: z.string().nullish(),
      })
      .nullish(),
    async resolve({ input }) {
      const args = input ?? {};
      const query = args.query ?? '';

      const res = await algoliaIndex.search<AlgoliaJob>(query);
      return res;
    },
  });
