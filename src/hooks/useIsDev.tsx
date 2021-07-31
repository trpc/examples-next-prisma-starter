import { useRouter } from 'next/router';

export function useIsDev() {
  const router = useRouter();
  const dev = 'dev' in router.query;
  return dev;
}
