/**
 * This file contains the root router of your tRPC-backend
 */
import { createRouter } from '../trpc';

export const jobsRouter = createRouter()
  /**
   * Optionally do custom error (type safe!) formatting
   * @link https://trpc.io/docs/error-formatting
   */
  // .formatError(({ shape, error }) => { })
  .query('all', {
    async resolve({ ctx }) {
      return ctx.prisma.job.findMany();
    },
  });
