/**
 *
 * This is an example router, you can delete this file and then update `../pages/api/trpc/[trpc].tsx`
 */

import { JobType } from '@prisma/client';
import { fetchJSON } from 'server/utils/fetchJSON';
import { zodJSONDate } from 'server/utils/zod';
import { z } from 'zod';
import { SourceFn } from '.';
import { CompanyUpsert, JobUpsert } from '../bulkUpsert';

export const remotive: SourceFn = async () => {
  const json = await fetchJSON({
    url: 'https://remotive.io/api/remote-jobs?search=typescript',
  });
  const schema = z.object({
    id: z.string().or(z.number()),
    url: z.string().url(),
    title: z.string().min(1),
    company_name: z.string().min(1),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    publication_date: zodJSONDate,
    candidate_required_location: z.string(),
    salary: z.string(),
    description: z.string(),
    job_type: z
      .string()
      .optional()
      .transform((v) => {
        console.log;
        if (v === 'full_time') {
          return JobType.FULL_TIME;
        }
        if (v === 'contract') {
          return JobType.CONTRACT;
        }
        return JobType.UNKNOWN;
      }),
  });

  const entries = z
    .object({
      jobs: z.array(z.unknown()),
    })
    .parse(json).jobs;

  const parsedJobs = entries.map((raw) => ({
    raw,
    res: schema.safeParse(raw),
  }));

  const failedJobs = parsedJobs.flatMap((item) =>
    !item.res.success ? [item.res.error] : [],
  );
  console.log('failed', failedJobs);
  const jobs = parsedJobs.flatMap((item, index) =>
    item.res.success ? [{ data: item.res.data, json: entries[index] }] : [],
  );
  return jobs.map((item) => {
    const { data, json } = item;
    const company: CompanyUpsert = {
      name: data.company_name,
    };
    const job: JobUpsert = {
      title: data.title,
      url: data.url,
      applyUrl: data.url,
      remote: true,
      publishDate: data.publication_date,
      sourceKey: '' + data.id,
      tags: data.tags,
      text: data.description,
      sourceJSON: JSON.stringify(json),
      jobType: data.job_type,
      location: data.candidate_required_location || 'Anywhere',
    };
    if (data.description) {
      job.text = data.description;
    }
    return { company, job };
  });
};
