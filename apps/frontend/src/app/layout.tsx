import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SectionScroll } from '../features/navigation/section-scroll';
import './globals.css';
export const metadata: Metadata = {
  title: 'Roomedy — make room for the way you live',
  description:
    'A fresh perspective on your bedroom or workspace. Review a rough 2D sketch, then explore arrangements in 2D and 3D.',
  icons: {
    icon: [
      {
        url: '/favicon.ico?v=room-mark-3-rounded',
        sizes: '16x16 32x32 48x48',
        type: 'image/x-icon',
      },
      {
        url: '/brand/roomedy-icon-96.png?v=room-mark-3-rounded',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        url: '/brand/roomedy-icon.svg?v=room-mark-3-rounded',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        url: '/brand/roomedy-icon-192.png?v=room-mark-3-rounded',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/brand/roomedy-icon-512.png?v=room-mark-3-rounded',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    apple: {
      url: '/brand/roomedy-apple-180.png?v=room-mark-2',
      sizes: '180x180',
      type: 'image/png',
    },
  },
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <SectionScroll className="skip-link" target="main-content">
          Skip to content
        </SectionScroll>
        {children}
      </body>
    </html>
  );
}
