'use client';

import { MantineProvider, localStorageColorSchemeManager } from '@mantine/core';
import { theme } from '@/theme/theme';

const colorSchemeManager = localStorageColorSchemeManager();

interface MantineProviderClientProps {
  children: React.ReactNode;
}

export function MantineProviderClient({ children }: MantineProviderClientProps) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark" colorSchemeManager={colorSchemeManager}>
      {children}
    </MantineProvider>
  );
}
