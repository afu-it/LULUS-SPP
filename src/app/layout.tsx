import type { Metadata } from 'next';
import { ColorSchemeScript } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { MantineProviderClient } from '@/providers/MantineProviderClient';
import { AppShellLayout } from '@/components/layout/AppShell';
import { AuthProvider } from '@/providers/AuthProvider';
import { I18nProvider } from '@/providers/I18nProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'LULUS SPP',
  description: 'Panduan & komuniti untuk calon SPP Malaysia',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms">
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body>
        <MantineProviderClient>
          <Notifications position="top-center" limit={2} containerWidth={280} />
          <ModalsProvider>
            <I18nProvider>
              <AuthProvider>
                <AppShellLayout>{children}</AppShellLayout>
              </AuthProvider>
            </I18nProvider>
          </ModalsProvider>
        </MantineProviderClient>
      </body>
    </html>
  );
}
