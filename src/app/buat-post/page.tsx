'use client';

import { useState } from 'react';
import { Box, Button, Container, Group, Stack, Text, Textarea, TextInput, ActionIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import { IconArrowLeft, IconLink } from '@tabler/icons-react';
import { useGuestName } from '@/hooks/useGuestName';
import { useAuth } from '@/hooks/useAuth';

export default function CreatePostPage() {
  const router = useRouter();
  const { guestName, authorToken, isReady: isGuestReady } = useGuestName();
  const { isAdmin, adminUsername } = useAuth();
  const [content, setContent] = useState('');
  const [sourceLink, setSourceLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const effectiveAuthorName = isAdmin ? (adminUsername ?? 'Admin') : (guestName || 'Tetamu');

  async function handleCreatePost() {
    const trimmed = content.trim();

    if (!trimmed) return;

    if (!authorToken && !isAdmin) {
      notifications.show({
        color: 'red',
        title: 'Ralat',
        message: 'Author token belum tersedia. Cuba lagi sebentar.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: trimmed,
          authorName: effectiveAuthorName,
          authorToken: authorToken || 'admin-post',
          sourceLink: sourceLink.trim() || undefined,
          isAdminPost: isAdmin,
        }),
      });

      if (!response.ok) throw new Error('Unable to create post');

      notifications.show({ color: 'green', title: 'Berjaya', message: 'Post berjaya dibuat.' });
      router.push('/');
    } catch {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat membuat post.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Container px={0} py={0} bg="#181818" style={{ minHeight: '100vh' }}>
      <Box
        pos="sticky"
        top={0}
        bg="#181818"
        style={{ zIndex: 100, borderBottom: '1px solid var(--mantine-color-default-border)' }}
        px="md"
        py="sm"
      >
        <Group align="center" wrap="nowrap" pos="relative" style={{ minHeight: 36 }}>
          <Box style={{ flex: 1 }}>
            <ActionIcon variant="subtle" color="gray" onClick={() => router.back()}>
              <IconArrowLeft size={22} />
            </ActionIcon>
          </Box>
          <Text fw={800} size="lg" style={{ letterSpacing: '1px', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            Buat Post
          </Text>
          <Box style={{ flex: 1, textAlign: 'right' }}>
            <Button size="xs" onClick={() => void handleCreatePost()} loading={isSubmitting} disabled={!content.trim()}>
              Hantar
            </Button>
          </Box>
        </Group>
      </Box>

      <Stack p="md" gap="md">
        <Textarea
          minRows={6}
          autosize
          value={content}
          onChange={(event) => setContent(event.currentTarget.value)}
          placeholder="Kongsi soalan, pengalaman, atau tip temuduga anda..."
          variant="unstyled"
          size="lg"
        />

        <TextInput
          leftSection={<IconLink size={14} />}
          placeholder="Kredit / pautan sumber (opsyenal), contoh: Dr Rahman atau https://maukerja.my/..."
          value={sourceLink}
          onChange={(e) => setSourceLink(e.currentTarget.value)}
          size="xs"
          variant="filled"
        />

        <Text size="xs" c={isAdmin ? undefined : 'dimmed'} style={isAdmin ? { color: '#262e5c', fontWeight: 600 } : undefined}>
          {isAdmin
            ? `Dipost sebagai admin: ${effectiveAuthorName}`
            : isGuestReady
              ? `Dipost sebagai: ${effectiveAuthorName}`
              : 'Menyediakan profil tetamu...'}
        </Text>
      </Stack>
    </Container>
  );
}
