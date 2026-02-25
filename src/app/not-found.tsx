'use client';

import Link from 'next/link';
import { Button, Container, Stack, Text, Title } from '@mantine/core';

export default function NotFound() {
  return (
    <Container py="xl">
      <Stack gap="md" align="center">
        <Title order={2}>Halaman tidak dijumpai</Title>
        <Text c="dimmed" ta="center">
          Maaf, halaman yang anda cari tidak tersedia.
        </Text>
        <Button component={Link} href="/">
          Kembali ke Home
        </Button>
      </Stack>
    </Container>
  );
}
