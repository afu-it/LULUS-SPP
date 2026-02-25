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
        radius="xl"
        color="brand"
        variant="filled"
        onClick={onClick}
        aria-label={label}
      >
        {icon}
      </ActionIcon>
    </Tooltip>
  );
}
