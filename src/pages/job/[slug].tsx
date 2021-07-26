import { useRouter } from 'next/dist/client/router';
import { trpc } from 'utils/trpc';

export default function JobPage() {
  const slug = useRouter().query.slug as string;

  const query = trpc.useQuery(['job.public.bySlug', slug]);

  return <>{query.data && <pre>{JSON.stringify(query.data, null, 4)}</pre>}</>;
}
