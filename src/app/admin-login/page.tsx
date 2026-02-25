'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Alert as MantineAlert,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  List,
  Paper,
  PasswordInput,
  Stack,
  Text,
  Textarea,
  Title,
  TextInput,
  ActionIcon,
} from '@mantine/core';
import { IconAlertCircle, IconBell, IconBellOff, IconCheck, IconSpeakerphone, IconTrash, IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '@/hooks/useAuth';
import type { AnnouncementItem } from '@/types/entities';

interface FeedbackMessage {
  tone: 'error' | 'success';
  text: string;
}

interface BannerItem {
  id: string;
  content: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminLoginPage() {
  const { isLoading, isAdmin, adminUsername, login, logout } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  // Announcements state
  const [annList, setAnnList] = useState<AnnouncementItem[]>([]);
  const [isLoadingAnn, setIsLoadingAnn] = useState(false);
  const [annDraft, setAnnDraft] = useState('');
  const [isSavingAnn, setIsSavingAnn] = useState(false);

  // Banner state
  const [banner, setBanner] = useState<BannerItem | null>(null);
  const [isLoadingBanner, setIsLoadingBanner] = useState(false);
  const [bannerDraft, setBannerDraft] = useState('');
  const [isSavingBanner, setIsSavingBanner] = useState(false);

  useEffect(() => {
    setFeedback(null);
  }, [isAdmin]);

  const loadAnnouncements = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoadingAnn(true);
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const body = (await res.json()) as { items: AnnouncementItem[] };
        setAnnList(body.items ?? []);
      }
    } finally {
      setIsLoadingAnn(false);
    }
  }, [isAdmin]);

  const loadBanner = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoadingBanner(true);
    try {
      const res = await fetch('/api/banner');
      if (res.ok) {
        const body = (await res.json()) as { item: BannerItem | null };
        setBanner(body.item);
        setBannerDraft(body.item?.content ?? '');
      }
    } finally {
      setIsLoadingBanner(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void loadAnnouncements();
    void loadBanner();
  }, [loadAnnouncements, loadBanner]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await login(username.trim(), password);
    if (!result.ok) {
      const msg = (result.error ?? '').toLowerCase();
      let text = 'Ralat semasa log masuk.';
      if (msg.includes('invalid username') || msg.includes('invalid username or password')) {
        text = 'Nama pengguna atau kata laluan salah.';
      } else if (msg.includes('too many login attempts')) {
        text = 'Terlalu banyak percubaan. Cuba lagi sebentar.';
      }
      setFeedback({ tone: 'error', text });
      return;
    }
    setPassword('');
    setFeedback({ tone: 'success', text: 'Log masuk berjaya.' });
  }

  async function handleLogout() {
    await logout();
    setFeedback({ tone: 'success', text: 'Log keluar berjaya.' });
  }

  async function handleAddAnnouncement() {
    const content = annDraft.trim();
    if (!content) return;
    setIsSavingAnn(true);
    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, isActive: true }),
      });
      if (!response.ok) throw new Error('Unable to save');
      setAnnDraft('');
      await loadAnnouncements();
      notifications.show({ color: 'green', message: 'Pengumuman ditambah.' });
    } catch {
      notifications.show({ color: 'red', message: 'Tidak dapat simpan pengumuman.' });
    } finally {
      setIsSavingAnn(false);
    }
  }

  async function handleDeleteAnnouncement(id: string) {
    try {
      await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      setAnnList((prev) => prev.filter((a) => a.id !== id));
      notifications.show({ color: 'green', message: 'Pengumuman dipadam.' });
    } catch {
      notifications.show({ color: 'red', message: 'Gagal memadam.' });
    }
  }

  async function handleSaveBanner() {
    const content = bannerDraft.trim();
    if (!content) return;
    setIsSavingBanner(true);
    try {
      const response = await fetch('/api/banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Unable to save banner');
      await loadBanner();
      notifications.show({ color: 'green', message: 'Banner dikemas kini.' });
    } catch {
      notifications.show({ color: 'red', message: 'Tidak dapat simpan banner.' });
    } finally {
      setIsSavingBanner(false);
    }
  }

  async function handleDeleteBanner() {
    if (!banner?.id) return;
    setIsSavingBanner(true);
    try {
      await fetch('/api/banner', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: banner.id }),
      });
      setBanner(null);
      setBannerDraft('');
      notifications.show({ color: 'green', message: 'Banner dipadam.' });
    } catch {
      notifications.show({ color: 'red', message: 'Gagal memadam banner.' });
    } finally {
      setIsSavingBanner(false);
    }
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={3}>Panel Pentadbir</Title>

        {feedback && (
          <MantineAlert
            color={feedback.tone === 'error' ? 'red' : 'green'}
            icon={feedback.tone === 'error' ? <IconAlertCircle size={16} /> : <IconCheck size={16} />}
          >
            {feedback.text}
          </MantineAlert>
        )}

        {/* ── Login / Logout ── */}
        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Group justify="space-between">
              <Title order={5}>Status</Title>
              <Badge color={isAdmin ? 'green' : 'gray'}>
                {isAdmin ? 'Admin' : 'Tetamu'}
              </Badge>
            </Group>

            {isAdmin ? (
              <Stack gap="sm">
                <Text size="sm" c="dimmed">Log masuk sebagai: <strong>{adminUsername ?? 'admin'}</strong></Text>
                <Button onClick={handleLogout} loading={isLoading} variant="outline" color="red">
                  Log Keluar
                </Button>
              </Stack>
            ) : (
              <form onSubmit={(e) => void handleLogin(e)}>
                <Stack gap="sm">
                  <TextInput
                    label="Nama Pengguna"
                    value={username}
                    onChange={(e) => setUsername(e.currentTarget.value)}
                    required
                  />
                  <PasswordInput
                    label="Kata Laluan"
                    value={password}
                    onChange={(e) => setPassword(e.currentTarget.value)}
                    required
                  />
                  <Button type="submit" loading={isLoading}>
                    {isLoading ? 'Sedang Log Masuk...' : 'Log Masuk'}
                  </Button>
                </Stack>
              </form>
            )}
          </Stack>
        </Paper>

        {/* ── Announcement Management ── */}
        {isAdmin && (
          <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
              <Group justify="space-between" align="center">
                <Group gap="xs">
                  <IconSpeakerphone size={18} />
                  <Title order={5}>Pengumuman</Title>
                  {annList.length > 0 && <Badge size="xs" color="brand">{annList.length} aktif</Badge>}
                </Group>
              </Group>

              <Text size="xs" c="dimmed">
                Dipaparkan di halaman Notifikasi. Boleh tambah berbilang pengumuman.
              </Text>

              {/* Existing announcements list */}
              {isLoadingAnn ? (
                <Text size="sm" c="dimmed">Memuatkan...</Text>
              ) : annList.length > 0 ? (
                <List spacing="xs" size="sm">
                  {annList.map((ann) => (
                    <List.Item key={ann.id}>
                      <Group justify="space-between" wrap="nowrap">
                        <Text size="sm" style={{ flex: 1 }} lineClamp={2}>{ann.content}</Text>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color="red"
                          onClick={() => void handleDeleteAnnouncement(ann.id)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </Group>
                    </List.Item>
                  ))}
                </List>
              ) : (
                <Text size="xs" c="dimmed">Tiada pengumuman aktif.</Text>
              )}

              <Divider label="Tambah pengumuman baharu" labelPosition="left" />

              <Textarea
                minRows={2}
                autosize
                value={annDraft}
                onChange={(e) => setAnnDraft(e.currentTarget.value)}
                placeholder="Tulis pengumuman penting untuk semua calon..."
              />

              <Button
                onClick={() => void handleAddAnnouncement()}
                loading={isSavingAnn}
                disabled={!annDraft.trim()}
                leftSection={<IconSpeakerphone size={14} />}
              >
                Tambah Pengumuman
              </Button>
            </Stack>
          </Paper>
        )}

        {/* ── Sticky Banner Management ── */}
        {isAdmin && (
          <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
              <Group justify="space-between" align="center">
                <Group gap="xs">
                  <IconBell size={18} />
                  <Title order={5}>Banner Notifikasi</Title>
                  <Badge size="xs" color={banner ? 'green' : 'gray'}>
                    {banner ? 'Aktif' : 'Tiada'}
                  </Badge>
                </Group>
                {banner && (
                  <Button
                    size="xs"
                    variant="subtle"
                    color="red"
                    leftSection={<IconBellOff size={14} />}
                    onClick={() => void handleDeleteBanner()}
                    loading={isSavingBanner}
                  >
                    Padam
                  </Button>
                )}
              </Group>

              <Text size="xs" c="dimmed">
                Banner muncul di atas halaman utama. Pengguna boleh tutup dengan klik X.
              </Text>

              {banner && (
                <Box
                  p="xs"
                  style={{
                    background: 'rgba(38,46,92,0.25)',
                    border: '1px solid rgba(38,46,92,0.5)',
                    borderRadius: 8,
                  }}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Text size="xs" c="dimmed" mb={2}>Banner aktif:</Text>
                    <IconX size={12} color="gray" />
                  </Group>
                  <Text size="sm">{banner.content}</Text>
                </Box>
              )}

              {isLoadingBanner ? (
                <Text size="sm" c="dimmed">Memuatkan...</Text>
              ) : (
                <>
                  <Divider label={banner ? 'Ganti banner' : 'Cipta banner baharu'} labelPosition="left" />
                  <Textarea
                    minRows={2}
                    autosize
                    value={bannerDraft}
                    onChange={(e) => setBannerDraft(e.currentTarget.value)}
                    placeholder="Tulis mesej banner untuk halaman utama..."
                  />
                  <Button
                    onClick={() => void handleSaveBanner()}
                    loading={isSavingBanner}
                    disabled={!bannerDraft.trim()}
                    leftSection={<IconBell size={14} />}
                  >
                    {banner ? 'Ganti Banner' : 'Aktifkan Banner'}
                  </Button>
                </>
              )}
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
