import { useRouter } from 'next/dist/client/router';
import { trpc } from 'utils/trpc';

export default function JobPage() {
  const slug = useRouter().query.slug as string;

  const query = trpc.useQuery(['job.public.bySlug', slug]);

  const job = query.data;
  return (
    <>
      {job && (
        <>
          <h1>{job.title}</h1>
          <pre>{JSON.stringify(job, null, 4)}</pre>
        </>
      )}
    </>
  );
}
