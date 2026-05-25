import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Elitez FMCG BD Portal',
  description: 'Internal business development portal — Singapore FMCG launch intelligence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="bg-zinc-950 text-zinc-100 antialiased font-[var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}
