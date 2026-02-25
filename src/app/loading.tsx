import { Center, Loader, Stack, Text } from '@mantine/core';

export default function GlobalLoading() {
  return (
    <Center py={72}>
      <Stack align="center" gap="xs">
        <Loader color="brand" />
        <Text size="sm" c="dimmed">
          Memuatkan kandungan...
        </Text>
      </Stack>
    </Center>
  );
}
