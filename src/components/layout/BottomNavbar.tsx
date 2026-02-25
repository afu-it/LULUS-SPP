'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, UnstyledButton, Text, Stack } from '@mantine/core';
import { useWindowScroll } from '@mantine/hooks';
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
  const [scroll] = useWindowScroll();
  const lastScrollYRef = useRef(0);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    const nextY = scroll.y;
    const delta = nextY - lastScrollYRef.current;

    // Hide only on strong downward scroll; show quickly when scrolling up.
    if (delta > 14 && nextY > 72) {
      setIsHidden(true);
    } else if (delta < -4) {
      setIsHidden(false);
    }

    lastScrollYRef.current = nextY;
  }, [scroll.y]);

  return (
    <Box component="nav" className={`${classes.navbar} ${isHidden ? classes.hidden : ''}`}>
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
