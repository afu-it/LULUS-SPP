'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, UnstyledButton, Text, Stack } from '@mantine/core';
import {
  IconHome,
  IconNotes,
  IconBulb,
  IconMessageQuestion,
  IconClipboardList,
  IconSettings,
} from '@tabler/icons-react';
import classes from './BottomNavbar.module.css';

const navItems = [
  { href: '/', label: 'Home', icon: IconHome },
  { href: '/nota', label: 'Nota SPP', icon: IconNotes },
  { href: '/tips', label: 'Tips SPP', icon: IconBulb },
  { href: '/soalan', label: 'Soalan IV', icon: IconMessageQuestion },
  { href: '/cara-daftar', label: 'Cara Daftar', icon: IconClipboardList },
  { href: '/settings', label: 'Settings', icon: IconSettings },
];

export function BottomNavbar() {
  const pathname = usePathname();

  return (
    <Box component="nav" className={classes.navbar}>
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === '/' ? pathname === '/' : pathname.startsWith(href);

        return (
          <UnstyledButton
            key={href}
            component={Link}
            href={href}
            className={classes.navItem}
            data-active={isActive || undefined}
          >
            <Stack align="center" gap={2}>
              <Icon size={22} stroke={isActive ? 2 : 1.5} />
              <Text size="10px" fw={isActive ? 700 : 400} lh={1.2}>
                {label}
              </Text>
            </Stack>
          </UnstyledButton>
        );
      })}
    </Box>
  );
}
