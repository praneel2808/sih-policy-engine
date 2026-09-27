import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MAITRI Single Window — Unified Industrial Approval System',
  description:
    'Statutory approval and incentive evaluation engine for industrial projects in Maharashtra.',
  icons: {
    icon: [
      { url: '/maharashtra-emblem.png', type: 'image/png' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/maharashtra-emblem.png',
    apple: '/maharashtra-emblem.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={plusJakarta.className}>
      <head>
        <link rel="icon" href="/maharashtra-emblem.png" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/maharashtra-emblem.png" type="image/png" />
        <link rel="apple-touch-icon" href="/maharashtra-emblem.png" />
      </head>
      <body className="min-h-screen bg-slate-100/90 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
