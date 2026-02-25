'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDateTime, formatRelativeTime } from '@/lib/date';
import { useAuth } from '@/hooks/useAuth';
import { useGuestName } from '@/hooks/useGuestName';
import type { BidangItem, SoalanItem } from '@/types/entities';

interface SoalanFormState {
  content: string;
  bidangId: string;
}

const EMPTY_FORM: SoalanFormState = {
  content: '',
  bidangId: '',
};

export default function SoalanPage() {
  const { isAdmin } = useAuth();
  const { guestName, authorToken } = useGuestName();

  const [soalanList, setSoalanList] = useState<SoalanItem[]>([]);
  const [bidangList, setBidangList] = useState<BidangItem[]>([]);
  const [selectedBidangId, setSelectedBidangId] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSoalan, setEditingSoalan] = useState<SoalanItem | null>(null);
  const [form, setForm] = useState<SoalanFormState>(EMPTY_FORM);

  const [newBidangName, setNewBidangName] = useState('');
  const [isSavingBidang, setIsSavingBidang] = useState(false);

  async function loadBidang() {
    const response = await fetch('/api/bidang', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Unable to load bidang');
    }

    const data = (await response.json()) as { items?: BidangItem[] };
    const items = data.items ?? [];
    setBidangList(items);

    if (!selectedBidangId && items.length > 0) {
      setForm((prev) => ({ ...prev, bidangId: prev.bidangId || items[0].id }));
    }
  }

  async function loadSoalan(bidangId = selectedBidangId) {
    setIsLoading(true);

    try {
      const query = bidangId ? `?bidangId=${encodeURIComponent(bidangId)}` : '';
      const response = await fetch(`/api/soalan${query}`, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error('Unable to load soalan');
      }

      const data = (await response.json()) as { items?: SoalanItem[] };
      setSoalanList(data.items ?? []);
    } catch {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat memuat soalan.' });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        await loadBidang();
        await loadSoalan('');
      } catch {
        notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat memuat bidang.' });
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyFilter(nextBidangId: string) {
    setSelectedBidangId(nextBidangId);
    await loadSoalan(nextBidangId);
  }

  function openCreateModal() {
    setEditingSoalan(null);
    setForm({
      content: '',
      bidangId: bidangList[0]?.id ?? '',
    });
    setIsModalOpen(true);
  }

  function openEditModal(item: SoalanItem) {
    setEditingSoalan(item);
    setForm({
      content: item.content,
      bidangId: item.bidangId,
    });
    setIsModalOpen(true);
  }

  async function handleSubmitSoalan() {
    if (!authorToken) {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Author token belum tersedia.' });
      return;
    }

    const payload = {
      content: form.content.trim(),
      bidangId: form.bidangId,
      authorToken,
      authorName: guestName || 'Tetamu',
    };

    if (!payload.content || !payload.bidangId) {
      notifications.show({
        color: 'red',
        title: 'Ralat',
        message: 'Isi soalan dan pilih bidang sebelum menyimpan.',
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(editingSoalan ? `/api/soalan/${editingSoalan.id}` : '/api/soalan', {
        method: editingSoalan ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Unable to save soalan');
      }

      notifications.show({ color: 'green', title: 'Berjaya', message: 'Soalan berjaya disimpan.' });
      setIsModalOpen(false);
      setEditingSoalan(null);
      setForm(EMPTY_FORM);
      await loadSoalan(selectedBidangId);
    } catch {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat menyimpan soalan.' });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteSoalan(id: string) {
    if (!authorToken) {
      return;
    }

    try {
      const response = await fetch(`/api/soalan/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorToken }),
      });

      if (!response.ok) {
        throw new Error('Unable to delete soalan');
      }

      setSoalanList((prev) => prev.filter((item) => item.id !== id));
      notifications.show({ color: 'green', title: 'Berjaya', message: 'Soalan berjaya dipadam.' });
    } catch {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat memadam soalan.' });
    }
  }

  async function handleCreateBidang() {
    const name = newBidangName.trim();
    if (!name) {
      return;
    }

    setIsSavingBidang(true);

    try {
      const response = await fetch('/api/bidang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('Unable to create bidang');
      }

      await loadBidang();
      setNewBidangName('');
      notifications.show({ color: 'green', title: 'Berjaya', message: 'Bidang baharu ditambah.' });
    } catch {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat menambah bidang.' });
    } finally {
      setIsSavingBidang(false);
    }
  }

  const bidangSelectData = useMemo(
    () => [
      { value: '', label: 'Semua Bidang' },
      ...bidangList.map((bidang) => ({ value: bidang.id, label: bidang.name })),
    ],
    [bidangList]
  );

  const modalBidangData = useMemo(
    () => bidangList.map((bidang) => ({ value: bidang.id, label: bidang.name })),
    [bidangList]
  );

  return (
    <Container py="md">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2}>SOALAN IV SPP</Title>
            <Text size="sm" c="dimmed">
              Kongsi soalan temuduga terkini mengikut bidang.
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
            Tambah Soalan
          </Button>
        </Group>

        <Select
          label="Filter bidang"
          data={bidangSelectData}
          value={selectedBidangId}
          onChange={(value) => {
            const next = value ?? '';
            void applyFilter(next);
          }}
        />

        {isAdmin && (
          <Paper withBorder p="sm" radius="md" bg="#181818">
            <Stack gap="xs">
              <Text fw={600} size="sm">
                Tambah Bidang (Admin)
              </Text>
              <Group align="end">
                <TextInput
                  style={{ flex: 1 }}
                  placeholder="Contoh: Pendidikan Awal Kanak-kanak"
                  value={newBidangName}
                  onChange={(event) => setNewBidangName(event.currentTarget.value)}
                />
                <Button onClick={() => void handleCreateBidang()} loading={isSavingBidang}>
                  Simpan
                </Button>
              </Group>
            </Stack>
          </Paper>
        )}

        {isLoading ? (
          <Group justify="center" py="xl">
            <Loader />
          </Group>
        ) : soalanList.length === 0 ? (
          <EmptyState
            title="Tiada soalan ditemui"
            description="Tambah soalan baharu atau tukar filter bidang."
          />
        ) : (
          <Stack gap="sm">
            {soalanList.map((item) => {
              const canManage = isAdmin || (authorToken ? item.authorToken === authorToken : false);

              return (
                <Paper key={item.id} withBorder p="md" radius="md" bg="#181818">
                  <Group wrap="nowrap" align="flex-start" gap="sm">
                    <Avatar color="teal" radius="xl" size="md">
                      {item.authorName.charAt(0).toUpperCase() || 'T'}
                    </Avatar>
                    <Stack gap={6} style={{ flex: 1 }}>
                      <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <div>
                          <Group gap={6} align="center">
                            <Text fw={600} size="sm">
                              {item.authorName}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {formatRelativeTime(item.createdAt)}
                            </Text>
                          </Group>
                          <Group gap={6} mt={4}>
                            <Badge color="brand" variant="light" size="sm">
                              {item.bidangName}
                            </Badge>
                          </Group>
                        </div>

                        {canManage && (
                          <Group gap={4}>
                            <ActionIcon
                              variant="light"
                              color="blue"
                              onClick={() => openEditModal(item)}
                              aria-label="Edit soalan"
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="light"
                              color="red"
                              onClick={() => void handleDeleteSoalan(item.id)}
                              aria-label="Delete soalan"
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        )}
                      </Group>

                      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                        {item.content}
                      </Text>
                    </Stack>
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Stack>

      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSoalan ? 'Kemaskini Soalan' : 'Tambah Soalan Baharu'}
        centered
      >
        <Stack>
          <Textarea
            label="Soalan"
            minRows={4}
            autosize
            value={form.content}
            onChange={(event) => setForm((prev) => ({ ...prev, content: event.currentTarget.value }))}
            required
          />

          <Select
            label="Bidang"
            data={modalBidangData}
            value={form.bidangId}
            onChange={(value) => setForm((prev) => ({ ...prev, bidangId: value ?? '' }))}
            required
          />

          <Group justify="flex-end">
            <Button onClick={() => void handleSubmitSoalan()} loading={isSaving}>
              Simpan
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
