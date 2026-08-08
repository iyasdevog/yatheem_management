import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Yatheem Care — Student & Sponsor Management System',
  description:
    'Production-ready management system for orphan student admissions, sponsor slab allocations, multi-ledger voucher accounting, QR attendance, DigiLocker, and comprehensive reporting.',
  keywords: ['yatheem', 'orphan management', 'student sponsorship', 'madrasa', 'attendance', 'kerala'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-950 text-white">{children}</body>
    </html>
  );
}
