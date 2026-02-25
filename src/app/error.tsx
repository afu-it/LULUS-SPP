'use client';

import { useEffect } from 'react';
import { Alert, Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container py="xl">
      <Stack gap="md">
        <Title order={2}>Ralat aplikasi</Title>

        <Alert color="red" icon={<IconAlertCircle size={16} />} title="Ada masalah tidak dijangka">
          <Text size="sm">{error.message || 'Sila cuba semula sebentar lagi.'}</Text>
        </Alert>

        <Group>
          <Button onClick={reset}>Cuba semula</Button>
        </Group>
      </Stack>
    </Container>
  );
}
