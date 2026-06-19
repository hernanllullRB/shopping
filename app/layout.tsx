import './globals.css';
import type { Metadata } from 'next';
import { AuthHydrator } from '@/components/AuthHydrator';
import { Toaster } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'Shopping QA',
  description: 'App de shopping para QA manual',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthHydrator />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
