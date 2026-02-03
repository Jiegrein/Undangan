import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Daftar Undangan',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body className="bg-gray-900 min-h-screen">{children}</body>
    </html>
  );
}
