'use client';

import { Box } from '@mantine/core';
import { BottomNavbar } from './BottomNavbar';
import classes from './AppShell.module.css';

interface AppShellLayoutProps {
  children: React.ReactNode;
}

export function AppShellLayout({ children }: AppShellLayoutProps) {
  return (
    <Box className={classes.shell}>
      <Box component="main" className={classes.main}>
        {children}
      </Box>
      <BottomNavbar />
    </Box>
  );
}
