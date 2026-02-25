'use client';

import { Paper, Stack, Text, Title } from '@mantine/core';

interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Paper withBorder radius="md" p="lg">
      <Stack gap={6} align="center">
        <Title order={4} ta="center">
          {title}
        </Title>
        {description && (
          <Text size="sm" c="dimmed" ta="center">
            {description}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}
