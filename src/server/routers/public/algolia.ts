/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * This file contains the root router of your tRPC-backend
 */
import { algoliaIndex, AlgoliaJob } from 'server/utils/algolia';
import { z } from 'zod';
import { createRouter } from '../../trpc';
import _ from 'lodash';

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

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

      const fieldsForHighlights = ['title', 'tags'] as const;
      const relevantFields = [
        'id',
        // pick only what we need for page
        ...fieldsForHighlights,
        'id',
      ] as const;

      return {
        hits: res.hits.map((job) => {
          const essentials = _.pick(job, relevantFields);

          // ugly way of overriding job deets with markdown with highlights
          for (const key of relevantFields) {
            const hl = job._highlightResult?.[key];
            if (!hl) {
              continue;
            }
            if (!Array.isArray(hl)) {
              essentials[key] = (hl as any).value.replace(/<\/?em>/gi, '*');
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
            // algolia actually gives us a json date
            publishDate: new Date(job.publishDate),
            // $ indicates virtual field
            $slug: `${job.sourceSlug}-${job.sourceKey}-${slugify(job.title)}`,
          };
        }),
      };
    },
  });
