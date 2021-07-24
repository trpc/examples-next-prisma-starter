import { Prisma } from '@prisma/client';
import { prisma } from 'server/trpc';

export async function getAppState() {
  return await prisma.appState.upsert({
    create: {
      id: 1,
    },
    update: {},
    where: {
      id: 1,
    },
  });
}

export async function setAppState(
  state: Omit<Prisma.AppStateUpsertArgs['create'], 'id'>,
) {
  await prisma.appState.upsert({
    create: {
      ...state,
      id: 1,
    },
    update: state,
    where: {
      id: 1,
    },
  });
}
