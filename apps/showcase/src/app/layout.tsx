import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kinetic Banking OS Showcase',
  description: 'Banking OS Full Vision — Shared Customer Truth, CLO, Financial Coach, Intelligence Supply Chain',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
