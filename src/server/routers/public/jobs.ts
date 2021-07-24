/**
 * This file contains the root router of your tRPC-backend
 */
import { z } from 'zod';
import { createRouter } from '../../trpc';

export const jobsRouter = createRouter()
  //
  .query('all', {
    async resolve({ ctx }) {
      return ctx.prisma.job.findMany();
    },
  })
  .query('bySlug', {
    input: z.string(),
    async resolve({ ctx, input }) {
      const parts = input.split('-');
      // {{source}}-{{id}}-{{slug}}
      const [sourceSlug, sourceKey, ...rest] = parts;
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
