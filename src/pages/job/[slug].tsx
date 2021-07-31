import { useRouter } from 'next/dist/client/router';
import ReactMarkdown from 'react-markdown';
import { useQuery } from 'utils/trpc';

export default function JobPage() {
  const slug = useRouter().query.slug as string;

  const query = useQuery(['job.public.bySlug', slug]);

  const job = query.data;

  return (
    <>
      {job && (
        <>
          <h1>{job.title}</h1>
          <h2>Description</h2>

          <ReactMarkdown>{job.$mrkdwn}</ReactMarkdown>

          <hr />
          <h2>Raw data</h2>
          <details>
            <pre>{JSON.stringify(job, null, 4)}</pre>
          </details>
        </>
      )}
    </>
  );
}
