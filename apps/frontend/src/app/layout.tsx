import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
export const metadata: Metadata = {
  title: 'Roomedy — make room for the way you live',
  description:
    'A fresh perspective on your bedroom or workspace. Review a rough 2D sketch, then explore arrangements in 2D and 3D.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/brand/roomedy-icon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/brand/roomedy-icon.svg', sizes: 'any', type: 'image/svg+xml' },
      {
        url: '/brand/roomedy-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/brand/roomedy-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: {
      url: '/brand/roomedy-apple-180.png',
      sizes: '180x180',
      type: 'image/png',
    },
  },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
