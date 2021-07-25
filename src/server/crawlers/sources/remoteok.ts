/**
 *
 * This is an example router, you can delete this file and then update `../pages/api/trpc/[trpc].tsx`
 */

import { fetchJSON } from 'server/utils/fetchJSON';
import { z } from 'zod';
import { SourceFn } from '.';
import { CompanyUpsert, JobUpsert } from '../bulkUpsert';

const jsonDate = z
  .string()
  .transform((str) => {
    const date = new Date(str);
    return date;
  })
  .refine((v) => v.getTime() > 0);

export const remoteok: SourceFn = async () => {
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
  return jobs.map((item) => {
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
  });
};
