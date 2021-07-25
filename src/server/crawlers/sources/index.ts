import { Source } from '@prisma/client';
import { Dict } from '@trpc/server';
import { UpsertJobItems } from '../bulkUpsert';
import { remoteok } from './remoteok';

export type SourceFn = (source: Source) => Promise<UpsertJobItems>;
export const SOURCES: Dict<SourceFn> = {
  remoteok: remoteok,
};
