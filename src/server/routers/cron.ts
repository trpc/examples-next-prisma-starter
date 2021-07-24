/**
 *
 * This is an example router, you can delete this file and then update `../pages/api/trpc/[trpc].tsx`
 */

import { Company, Job, Prisma, Source } from '@prisma/client';
import { Dict } from '@trpc/server';
import { createRouter, prisma } from 'server/trpc';
import { alogliaReindex } from 'server/utils/algolia';
import { fetchJSON } from 'server/utils/fetchJSON';
import { z } from 'zod';
const jsonDate = z
  .string()
  .transform((str) => {
    const date = new Date(str);
    return date;
  })
  .refine((v) => v.getTime() > 0);

type CompanyUpsert = Prisma.CompanyUpsertArgs['create'];
type JobUpsert = Omit<
  Prisma.JobUpsertArgs['create'],
  | 'company'
  //
  | 'companyId'
  | 'sourceSlug'
  | 'source'
  | 'deletedAt'
  | 'tags'
> & { tags?: string[] };
async function upsertJobs(props: {
  source: Source;
  items: {
    company: CompanyUpsert;
    job: JobUpsert;
  }[];
}) {
  const typescriptRegex = /typescript/i;
  const frontendRegex = /react|vue/i;
  const nodeRegex = /\bnode\b|node\.js/i;
  const titleRegexes = [typescriptRegex, frontendRegex, nodeRegex];
  const tsItems = props.items.filter((item) => {
    return (
      titleRegexes.some((regex) => regex.test(item.job.title)) ||
      item.job.tags?.some((tag) => typescriptRegex.test(tag)) ||
      typescriptRegex.test(item.job.text)
    );
  });
  // const tsItems = props.items;
  await prisma.$transaction([
    ...tsItems.flatMap((item) => {
      const jobWithSourceId: Prisma.JobUpsertArgs['create'] = {
        ...item.job,
        company: {
          connect: {
            name: item.company.name,
          },
        },
        source: {
          connect: {
            id: props.source.id,
          },
        },
        deletedAt: null,
      };
      return [
        prisma.company.upsert({
          where: {
            name: item.company.name,
          },
          update: item.company,
          create: item.company,
        }),
        prisma.job.upsert({
          where: {
            sourceSlug_sourceKey: {
              sourceSlug: props.source.slug,
              sourceKey: item.job.sourceKey,
            },
          },
          update: jobWithSourceId,
          create: jobWithSourceId,
        }),
      ];
    }),
    // delete old jobs
    prisma.job.updateMany({
      where: {
        sourceSlug: props.source.slug,
        sourceKey: {
          notIn: tsItems.map((item) => item.job.sourceKey),
        },
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    }),
  ]);
}
async function pullRemoteOK(source: Source) {
  const json = await fetchJSON({
    url: 'https://remoteok.io/remote-jobs.json',
    // FIXME: why does the below url not work when it does in the browser?
    // url: 'https://remoteok.io/remote-typescript-jobs.json',
  });
  const remoteOkSchema = z.object({
    slug: z.string().optional(),
    id: z.string(),
    company: z.string().min(1),
    company_logo: z.literal('').or(z.string().url()).optional(),
    tags: z.array(z.string()).default([]),
    description: z.string(),
    location: z.string(),
    position: z.string(),
    url: z.string().url(),
    apply_url: z.string().url(),
    date: jsonDate,
  });

  const entries = z.array(z.unknown()).parse(json);

  entries.shift(); // pop warning
  const parsedJobs = entries.map((raw) => ({
    raw,
    res: remoteOkSchema.safeParse(raw),
  }));

  const jobs = parsedJobs.flatMap((item) =>
    item.res.success ? [item.res.data] : [],
  );
  await upsertJobs({
    source,
    items: jobs.map((item) => {
      const company: CompanyUpsert = {
        name: item.company,
      };
      if (item.company_logo) {
        company.logoUrl = item.company_logo;
      }
      const job: JobUpsert = {
        title: item.position,
        url: item.url,
        applyUrl: item.apply_url,
        remote: true,
        publishDate: item.date,
        sourceKey: item.id,
        tags: item.tags,
        text: item.description,
      };
      if (item.description) {
        job.text = item.description;
      }
      return { company, job };
    }),
  });
}

export const cronRouter = createRouter()
  .query('reindex', {
    async resolve() {
      return await alogliaReindex();
    },
  })
  .query('pull', {
    async resolve({ ctx }) {
      const sources = await ctx.prisma.source.findMany();
      const dict: Dict<(source: Source) => Promise<void>> = {
        remoteok: pullRemoteOK,
      };

      const results = await Promise.allSettled(
        sources.map(async (source) => {
          const fn = dict[source.slug];
          if (!fn) {
            throw new Error(`No such source "${source.slug}"`);
          }
          await fn(source);
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
