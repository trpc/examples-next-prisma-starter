import { createReactQueryHooks } from '@trpc/react';
import type { inferProcedureInput, inferProcedureOutput } from '@trpc/server';
// ℹ️ Type-only import:
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export
import type { AppRouter } from 'server/routers/app';

/**
 * A set of strongly-typed React hooks from your `AppRouter` type signature with `createReactQueryHooks`.
 * @link https://trpc.io/docs/react#3-create-trpc-hooks
 */
const trpc = createReactQueryHooks<AppRouter>();

// export const transformer = superjson;
/**
 * This is a helper method to infer the output of a query resolver
 * @example type HelloOutput = inferQueryOutput<'hello'>
 */
export type inferQueryOutput<
  TRouteKey extends keyof AppRouter['_def']['queries'],
> = inferProcedureOutput<AppRouter['_def']['queries'][TRouteKey]>;

/**
 * This is a helper method to infer the output of a query resolver
 * @example type HelloOutput = inferQueryOutput<'hello'>
 */
export type inferQueryInput<
  TRouteKey extends keyof AppRouter['_def']['queries'],
> = inferProcedureInput<AppRouter['_def']['queries'][TRouteKey]>;

export const useQuery = trpc.useQuery;
export const useInfiniteQuery = trpc.useInfiniteQuery;
export const useMutation = trpc.useMutation;
export const useUtils = trpc.useContext;

export function getBaseUrl() {
  if (process.browser) {
    return '';
  }
  // // reference for vercel.com
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // // reference for render.com
  // if (process.env.RENDER_INTERNAL_HOSTNAME) {
  //   return `http://${process.env.RENDER_INTERNAL_HOSTNAME}:${process.env.PORT}`;
  // }

  // assume localhost
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
