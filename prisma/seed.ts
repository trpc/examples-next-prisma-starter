import { PrismaClient, Source } from '@prisma/client';
const prisma = new PrismaClient();

const sources: Omit<Source, 'id'>[] = [
  {
    slug: 'remoteok',
    url: 'https://remoteok.io',
    name: 'RemoteOK',
  },
  {
    slug: 'remotive',
    url: 'https://remotive.io',
    name: 'Remotive',
  },
];
async function main() {
  const promises = sources.map((source) =>
    prisma.source.upsert({
      where: { slug: source.slug },
      update: source,
      create: source,
    }),
  );
  await Promise.all(promises);

  if (process.env.NODE_ENV === 'test') {
    await prisma.job.upsert({
      where: {
        sourceSlug_sourceKey: {
          sourceKey: 'tmp',
          sourceSlug: 'remoteok',
        },
      },
      update: {
        publishDate: new Date(),
        deletedAt: null,
      },
      create: {
        title: 'Seed TypeScript Job',
        text: 'Some text',
        url: 'https//example.com',
        applyUrl: 'https//example.com',
        remote: true,
        location: 'Nowhere',
        publishDate: new Date(),
        tags: ['cats'],
        jobType: 'UNKNOWN',
        sourceKey: 'tmp',
        source: {
          connect: {
            slug: 'remoteok',
          },
        },
        company: {
          create: {
            name: 'test',
          },
        },
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
