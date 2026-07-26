import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CMAA — Cultivation Master–Apprentice Agent',
  description: 'A Master-guided workspace for composite crop-state indicator induction',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
