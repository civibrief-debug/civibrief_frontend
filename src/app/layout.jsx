import React from 'react';
import './globals.css';
import { ClientLayout } from '../components/ClientLayout';

export const metadata = {
  title: 'DAILY BRIEF | Independent Tech, Business & Global News',
  description: 'Daily Brief brings you authoritative intelligence on artificial intelligence, sovereign tech, global markets, and energy transitions.',
  other: {
    'x-dns-prefetch-control': 'on'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/videos/make-money-poster.jpg" as="image" fetchPriority="high" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
