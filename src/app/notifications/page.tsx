'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  Box, Container, Group, ActionIcon, Title, Text, Stack, Badge, Divider, Loader, Button, Modal, Textarea
} from '@mantine/core';
import { IconArrowLeft, IconBellOff } from '@tabler/icons-react';
import Link from 'next/link';
import { Announcement } from '@prisma/client';
import { notifications } from '@mantine/notifications';
import { formatDateTime } from '@/lib/date';
import { AuthContext } from '@/providers/AuthProvider';
import { useContext } from 'react';

export default function NotificationsPage() {
  const auth = useContext(AuthContext);
  const isAdmin = auth?.isAdmin ?? false;
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoadingAnnouncement, setIsLoadingAnnouncement] = useState(true);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState('');
  const [isSubmittingAnnouncement, setIsSubmittingAnnouncement] = useState(false);

  const loadAnnouncement = useCallback(async () => {
    try {
      setIsLoadingAnnouncement(true);
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const body = (await res.json()) as { announcement: Announcement | null };
        setAnnouncement(body.announcement);
      }
    } catch {
      notifications.show({ color: 'red', message: 'Gagal muat pengumuman.' });
    } finally {
      setIsLoadingAnnouncement(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncement();
  }, [loadAnnouncement]);

  async function handleSaveAnnouncement() {
    const content = announcementDraft.trim();

    if (!content) {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Isi pengumuman diperlukan.' });
      return;
    }

    setIsSubmittingAnnouncement(true);

    try {
      const isEditing = Boolean(announcement?.id);
      const response = await fetch(
        isEditing ? `/api/announcements/${announcement?.id}` : '/api/announcements',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, isActive: true }),
        }
      );

      if (!response.ok) {
        throw new Error('Unable to save announcement');
      }

      await loadAnnouncement();
      setIsAnnouncementModalOpen(false);
      notifications.show({ color: 'green', message: 'Pengumuman dikemas kini.' });
    } catch {
      notifications.show({ color: 'red', message: 'Tidak dapat simpan pengumuman.' });
    } finally {
      setIsSubmittingAnnouncement(false);
    }
  }

  return (
    <Container px={0} py={0}>
      <Box
        pos="sticky"
        top={0}
        bg="#181818"
        style={{ zIndex: 100, borderBottom: '1px solid var(--mantine-color-default-border)' }}
        px="md"
        py="xs"
      >
        <Group align="center" wrap="nowrap" style={{ minHeight: 32 }}>
          <ActionIcon component={Link} href="/" variant="subtle" color="gray" size="lg">
            <IconArrowLeft size={22} />
          </ActionIcon>
          <Title order={3} size="h5" fw={700}>
            Notifikasi
          </Title>
          <Box style={{ flex: 1 }} />
          {isAdmin && (
            <Button size="xs" variant="light" onClick={() => {
              setAnnouncementDraft(announcement?.content ?? '');
              setIsAnnouncementModalOpen(true);
            }}>
              Edit Pengumuman
            </Button>
          )}
        </Group>
      </Box>

      <Stack gap={0}>
        {isLoadingAnnouncement ? (
          <Group justify="center" p="md">
            <Loader size="sm" />
          </Group>
        ) : announcement ? (
          <Box p="md" bg="#181818">
            <Stack gap={4}>
              <Group justify="space-between">
                <Badge color="brand" variant="filled">
                  Pengumuman
                </Badge>
                <Text size="xs" c="dimmed">
                  {formatDateTime(announcement.updatedAt as unknown as string)}
                </Text>
              </Group>
              <Text size="sm">{announcement.content}</Text>
            </Stack>
            <Divider mt="md" />
          </Box>
        ) : null}

        <Box p="xl" mt="xl">
          <Stack align="center" gap="md" c="dimmed">
            <IconBellOff size={48} stroke={1.5} />
            <Text size="sm" fw={500}>Tiada notifikasi setakat ini</Text>
            <Text size="xs" ta="center">
              Anda akan menerima notifikasi apabila ada interaksi baharu.
            </Text>
          </Stack>
        </Box>
      </Stack>

      <Modal
        opened={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        title="Kemaskini Pengumuman"
        centered
      >
        <Stack>
          <Textarea
            minRows={4}
            autosize
            value={announcementDraft}
            onChange={(event) => setAnnouncementDraft(event.currentTarget.value)}
            placeholder="Tulis pengumuman penting untuk semua calon..."
          />
          <Group justify="flex-end" mt="md">
            <Button
              variant="default"
              onClick={() => setIsAnnouncementModalOpen(false)}
              disabled={isSubmittingAnnouncement}
            >
              Batal
            </Button>
            <Button
              onClick={() => void handleSaveAnnouncement()}
              loading={isSubmittingAnnouncement}
            >
              Simpan
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
