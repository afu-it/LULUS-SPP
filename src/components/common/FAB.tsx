'use client';

import { ActionIcon, Tooltip } from '@mantine/core';
import classes from './FAB.module.css';

interface FABProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export function FAB({ label, icon, onClick }: FABProps) {
  return (
    <Tooltip label={label} position="left">
      <ActionIcon
        className={classes.fab}
        size={56}
        radius={8}
        bg="#1d1d1d"
        c="white"
        variant="filled"
        onClick={onClick}
        aria-label={label}
      >
        {icon}
      </ActionIcon>
    </Tooltip>
  );
}
