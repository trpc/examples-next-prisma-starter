import { ReactNode } from 'react';

export function Main(props: { children: ReactNode }) {
  return (
    <main className="flex-grow" id="main">
      {props.children}
    </main>
  );
}
