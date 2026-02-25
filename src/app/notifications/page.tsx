'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  Box, Container, Group, ActionIcon, Title, Text, Stack, Badge, Divider, Skeleton, Button, Modal, Textarea
} from '@mantine/core';
import { IconArrowLeft, IconBellOff, IconSpeakerphone, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';
import { AnnouncementItem } from '@/types/entities';
import { notifications } from '@mantine/notifications';
import { formatDateTime } from '@/lib/date';
import { AuthContext } from '@/providers/AuthProvider';
import { useContext } from 'react';

export default function NotificationsPage() {
  const auth = useContext(AuthContext);
  const isAdmin = auth?.isAdmin ?? false;
  const [announcementList, setAnnouncementList] = useState<AnnouncementItem[]>([]);
  const [isLoadingAnnouncement, setIsLoadingAnnouncement] = useState(true);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementDraft, setAnnouncementDraft] = useState('');
  const [isSubmittingAnnouncement, setIsSubmittingAnnouncement] = useState(false);

  const loadAnnouncements = useCallback(async () => {
    try {
      setIsLoadingAnnouncement(true);
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const body = (await res.json()) as { items: AnnouncementItem[] };
        setAnnouncementList(body.items ?? []);
      }
    } catch {
      notifications.show({ color: 'red', message: 'Gagal muat pengumuman.' });
    } finally {
      setIsLoadingAnnouncement(false);
    }
  }, []);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  async function handleSaveAnnouncement() {
    const content = announcementDraft.trim();
    if (!content) {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Isi pengumuman diperlukan.' });
      return;
    }
    setIsSubmittingAnnouncement(true);
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, isActive: true }),
      });
      if (!response.ok) throw new Error('Unable to save announcement');
      await loadAnnouncements();
      setIsAnnouncementModalOpen(false);
      setAnnouncementDraft('');
      notifications.show({ color: 'green', message: 'Pengumuman ditambah.' });
    } catch {
      notifications.show({ color: 'red', message: 'Tidak dapat simpan pengumuman.' });
    } finally {
      setIsSubmittingAnnouncement(false);
    }
  }

  async function handleDeleteAnnouncement(id: string) {
    try {
      await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      setAnnouncementList((prev) => prev.filter((a) => a.id !== id));
      notifications.show({ color: 'green', message: 'Pengumuman dipadam.' });
    } catch {
      notifications.show({ color: 'red', message: 'Gagal memadam pengumuman.' });
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
            <Button size="xs" variant="light" leftSection={<IconSpeakerphone size={14} />} onClick={() => {
              setAnnouncementDraft('');
              setIsAnnouncementModalOpen(true);
            }}>
              + Pengumuman
            </Button>
          )}
        </Group>
      </Box>

      <Stack gap={0}>
        {isLoadingAnnouncement ? (
          <Stack p="md" gap="sm">
            {[...Array(2)].map((_, index) => (
              <Box key={`announcement-skeleton-${index}`} p="sm" bg="#181818" style={{ borderRadius: 8 }}>
                <Skeleton height={11} width="40%" mb={6} />
                <Skeleton height={10} width="92%" />
                <Skeleton height={10} width="68%" mt={6} />
              </Box>
            ))}
          </Stack>
        ) : announcementList.length > 0 ? (
          announcementList.map((ann) => (
            <Box key={ann.id} p="md" bg="#181818">
              <Stack gap={4}>
                <Group justify="space-between">
                  <Badge color="brand" variant="filled">
                    📣 Pengumuman
                  </Badge>
                  <Group gap={6}>
                    <Text size="xs" c="dimmed">
                      {formatDateTime(ann.updatedAt as unknown as string)}
                    </Text>
                    {isAdmin && (
                      <ActionIcon
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={() => void handleDeleteAnnouncement(ann.id)}
                      >
                        <IconTrash size={12} />
                      </ActionIcon>
                    )}
                  </Group>
                </Group>
                <Text size="sm">{ann.content}</Text>
              </Stack>
              <Divider mt="md" />
            </Box>
          ))
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
        title="Tambah Pengumuman Baharu"
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
              Hantar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
