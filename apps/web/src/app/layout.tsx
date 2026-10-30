import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'School Management System',
  description: 'Manage your school efficiently',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body className="antialiased bg-slate-50">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}