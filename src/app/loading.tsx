import { Center, Skeleton, Stack, Text } from '@mantine/core';

export default function GlobalLoading() {
  return (
    <Center py={72}>
      <Stack align="center" gap="xs">
        <Skeleton height={14} width={160} radius="xl" />
        <Skeleton height={10} width={110} radius="xl" />
        <Text size="sm" c="dimmed">
          Memuatkan kandungan...
        </Text>
      </Stack>
    </Center>
  );
}
