import { useCallback, useEffect, useRef } from 'react';

export function useDebouncedCallback<TArgs extends any[]>(
  callback: (...args: TArgs) => void,
  wait: number,
) {
  // track args & timeout handle between calls
  const argsRef = useRef<TArgs>();
  const timeout = useRef<ReturnType<typeof setTimeout>>();
  const callbackRef = useRef<(...args: TArgs) => void>();
  callbackRef.current = callback;

  function cleanup() {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
  }

  // make sure our timeout gets cleared if
  // our consuming component gets unmounted
  useEffect(() => cleanup, []);

  return useCallback(
    function debouncedCallback(...args: TArgs) {
      // capture latest args
      argsRef.current = args;

      // clear debounce timer
      cleanup();

      // start waiting again
      timeout.current = setTimeout(() => {
        if (argsRef.current) {
          callbackRef.current!(...argsRef.current);
        }
      }, wait);
    },
    [wait],
  );
}
