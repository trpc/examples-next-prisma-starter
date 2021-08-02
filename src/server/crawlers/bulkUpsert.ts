import { Prisma, Source } from '@prisma/client';
import _ from 'lodash';
import { prisma } from 'server/trpc';

export type CompanyUpsert = Prisma.CompanyUpsertArgs['create'];
export type JobUpsert = Omit<
  Prisma.JobUpsertArgs['create'],
  | 'company'
  //
  | 'companyId'
  | 'sourceSlug'
  | 'source'
  | 'deletedAt'
  | 'tags'
> & { tags?: string[] };

export type UpsertJobItems = {
  company: CompanyUpsert;
  job: JobUpsert;
}[];
type BulkUpsertJobProps = {
  source: Source;
  items: UpsertJobItems;
};
export async function bulkUpsertJobs(props: BulkUpsertJobProps) {
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
  await Promise.allSettled(
    tsItems.flatMap((item) => {
      const jobWithSourceId: Prisma.JobUpsertArgs['create'] = {
        ...item.job,
        tags: _.uniq(item.job.tags),
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
  );
  // delete old jobs
  await prisma.job.updateMany({
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
  });
}
