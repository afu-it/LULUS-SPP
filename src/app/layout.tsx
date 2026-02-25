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
          <Notifications
            position="bottom-center"
            limit={3}
            containerWidth={320}
            zIndex={9999}
            styles={{
              // Mantine renders multiple fixed roots (top/bottom variants);
              // setting `bottom` here would stretch top roots and block clicks.
              root: { gap: 8 },
              notification: {
                borderRadius: 12,
                boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
                backdropFilter: 'blur(8px)',
                background: 'rgba(30,30,40,0.95)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '10px 14px',
              },
            }}
          />
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
