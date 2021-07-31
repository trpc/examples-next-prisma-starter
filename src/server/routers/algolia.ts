/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * This file contains the root router of your tRPC-backend
 */
import { algoliaIndex, AlgoliaJob, alogliaReindex } from 'server/utils/algolia';
import { z } from 'zod';
import { createRouter } from '../trpc';
import _ from 'lodash';
import { slugify } from 'server/utils/slugify';

export const algoliaRouter = createRouter()
  // TODO make private / authed
  .query('reindex', {
    resolve() {
      return alogliaReindex({ flush: true });
    },
  })
  .query('public.search', {
    input: z
      .object({
        query: z.string().nullish(),
        cursor: z.number().nullish(),
      })
      .nullish(),
    async resolve({ input }) {
      const args = input ?? {};
      const query = args.query ?? '';
      const page = args.cursor ?? 0;

      const raw = await algoliaIndex.search<AlgoliaJob>(query, {
        page,
        filters: '__tags:not-deleted',
      });

      const fieldsForHighlights = [
        'title',
        'tags',
        'location',
        'companyName',
      ] as const;
      const relevantFields = [
        'id',
        // pick only what we need for page
        ...fieldsForHighlights,
        'id',
        '__score',
      ] as const;

      const res = {
        ..._.pick(raw, ['nbHits', 'pages', 'page', 'nbPages', 'hitsPerPage']),
        hits: raw.hits.map((job) => {
          const essentials = _.pick(job, relevantFields);

          // ugly way of overriding job deets with markdown with highlights
          for (const key of fieldsForHighlights) {
            const hl = job._highlightResult?.[key];
            if (!hl) {
              continue;
            }
            if (!Array.isArray(hl)) {
              (essentials as any)[key] = (hl as any).value.replace(
                /<\/?em>/gi,
                '*',
              );
              continue;
            }
            // array in array, sue me
            for (const index in hl) {
              const entry = hl[index];
              if (!entry) {
                continue;
              }
              (essentials as any)[key][index] = entry.value.replace(
                /<\/?em>/gi,
                '*',
              );
            }
          }

          return {
            ...essentials,
            // algolia gives us a json date string
            publishDate: new Date(job.publishDate),
            // $ indicates virtual field
            $slug: `${job.sourceSlug}-${job.sourceKey}-${slugify(job.title)}`,
          };
        }),
      };
      return res;
    },
  });
