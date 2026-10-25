import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'School Management System',
  description: 'Manage your school efficiently',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}