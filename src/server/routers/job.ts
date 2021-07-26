/**
 * This file contains the root router of your tRPC-backend
 */
import { z } from 'zod';
import { createRouter } from '../trpc';

export const jobRouter = createRouter()
  //
  .query('public.bySlug', {
    input: z.string(),
    async resolve({ ctx, input }) {
      const parts = input.split('-');
      const [sourceSlug, sourceKey] = parts;
      return ctx.prisma.job.findUnique({
        where: {
          sourceSlug_sourceKey: {
            sourceKey,
            sourceSlug,
          },
        },
      });
    },
  });
