import { PrismaClient, Source } from '@prisma/client';
const prisma = new PrismaClient();

const sources: Omit<Source, 'id'>[] = [
  {
    slug: 'remoteok',
    url: 'https://remoteok.io',
  },
  {
    slug: 'remotive',
    url: 'https://remotive.io',
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
