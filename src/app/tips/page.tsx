'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Modal,
  MultiSelect,
  Paper,
  Select,
  Stack,
  TagsInput,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDateTime } from '@/lib/date';
import { useAuth } from '@/hooks/useAuth';
import { useGuestName } from '@/hooks/useGuestName';
import type { TipItem, TipLabelItem } from '@/types/entities';

interface TipFormState {
  content: string;
  labelIds: string[];
  newLabels: string[];
}

const EMPTY_FORM: TipFormState = {
  content: '',
  labelIds: [],
  newLabels: [],
};

export default function TipsPage() {
  const { isAdmin } = useAuth();
  const { guestName, authorToken } = useGuestName();

  const [tips, setTips] = useState<TipItem[]>([]);
  const [labels, setLabels] = useState<TipLabelItem[]>([]);
  const [selectedLabelId, setSelectedLabelId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTip, setEditingTip] = useState<TipItem | null>(null);
  const [form, setForm] = useState<TipFormState>(EMPTY_FORM);

  async function loadLabels() {
    const response = await fetch('/api/labels', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Unable to fetch labels');
    }

    const data = (await response.json()) as { items?: TipLabelItem[] };
    setLabels(data.items ?? []);
  }

  async function loadTips(labelId = selectedLabelId) {
    setIsLoading(true);

    try {
      const query = labelId ? `?labelId=${encodeURIComponent(labelId)}` : '';
      const response = await fetch(`/api/tips${query}`, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error('Unable to fetch tips');
      }

      const data = (await response.json()) as { items?: TipItem[] };
      setTips(data.items ?? []);
    } catch {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat memuat tips.' });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        await loadLabels();
        await loadTips('');
      } catch {
        notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat memuat label tips.' });
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyFilter(nextLabelId: string) {
    setSelectedLabelId(nextLabelId);
    await loadTips(nextLabelId);
  }

  function openCreateModal() {
    setEditingTip(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  }

  function openEditModal(tip: TipItem) {
    setEditingTip(tip);
    setForm({
      content: tip.content,
      labelIds: tip.labels.map((label) => label.id),
      newLabels: [],
    });
    setIsModalOpen(true);
  }

  async function handleSubmitTip() {
    if (!authorToken) {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Author token belum tersedia.' });
      return;
    }

    const payload = {
      content: form.content.trim(),
      labelIds: form.labelIds,
      newLabels: form.newLabels,
      authorToken,
      authorName: guestName || 'Tetamu',
    };

    if (!payload.content) {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Kandungan tip diperlukan.' });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(editingTip ? `/api/tips/${editingTip.id}` : '/api/tips', {
        method: editingTip ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Unable to save tip');
      }

      notifications.show({ color: 'green', title: 'Berjaya', message: 'Tip berjaya disimpan.' });
      setIsModalOpen(false);
      setEditingTip(null);
      setForm(EMPTY_FORM);
      await loadLabels();
      await loadTips(selectedLabelId);
    } catch {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat menyimpan tip.' });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteTip(tipId: string) {
    if (!authorToken) {
      return;
    }

    try {
      const response = await fetch(`/api/tips/${tipId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorToken }),
      });

      if (!response.ok) {
        throw new Error('Unable to delete tip');
      }

      setTips((prev) => prev.filter((tip) => tip.id !== tipId));
      notifications.show({ color: 'green', title: 'Berjaya', message: 'Tip berjaya dipadam.' });
    } catch {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat memadam tip.' });
    }
  }

  const labelSelectData = useMemo(
    () => [
      { value: '', label: 'Semua Label' },
      ...labels.map((label) => ({ value: label.id, label: label.name })),
    ],
    [labels]
  );

  const labelMultiData = useMemo(
    () => labels.map((label) => ({ value: label.id, label: label.name })),
    [labels]
  );

  return (
    <Container py="md">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2}>TIPS SPP</Title>
            <Text size="sm" c="dimmed">
              Kongsi tips persediaan temuduga mengikut label.
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
            Tambah Tip
          </Button>
        </Group>

        <Select
          label="Filter label"
          data={labelSelectData}
          value={selectedLabelId}
          onChange={(value) => {
            const next = value ?? '';
            void applyFilter(next);
          }}
        />

        {isLoading ? (
          <Group justify="center" py="xl">
            <Loader />
          </Group>
        ) : tips.length === 0 ? (
          <EmptyState
            title="Tiada tip ditemui"
            description="Tambah tip baharu atau pilih label lain."
          />
        ) : (
          <Stack gap="sm">
            {tips.map((tip) => {
              const canManage = isAdmin || (authorToken ? tip.authorToken === authorToken : false);

              return (
                <Paper key={tip.id} withBorder p="md" radius="md">
                  <Stack gap={6}>
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <div>
                        <Text size="xs" c="dimmed">
                          Oleh {tip.authorName} • {formatDateTime(tip.createdAt)}
                        </Text>
                      </div>

                      {canManage && (
                        <Group gap={4}>
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => openEditModal(tip)}
                            aria-label="Edit tip"
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => void handleDeleteTip(tip.id)}
                            aria-label="Delete tip"
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      )}
                    </Group>

                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                      {tip.content}
                    </Text>

                    <Group gap={6}>
                      {tip.labels.map((label) => (
                        <Badge key={label.id} color="brand" variant="light">
                          {label.name}
                        </Badge>
                      ))}
                    </Group>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Stack>

      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTip ? 'Kemaskini Tip' : 'Tambah Tip Baharu'}
        centered
      >
        <Stack>
          <Textarea
            label="Kandungan Tip"
            minRows={4}
            autosize
            value={form.content}
            onChange={(event) => setForm((prev) => ({ ...prev, content: event.currentTarget.value }))}
            required
          />

          <MultiSelect
            label="Pilih label sedia ada"
            data={labelMultiData}
            value={form.labelIds}
            onChange={(value) => setForm((prev) => ({ ...prev, labelIds: value }))}
            placeholder="Contoh: Pemakaian, Intonasi"
            searchable
            clearable
          />

          <TagsInput
            label="Tambah label baharu"
            value={form.newLabels}
            onChange={(value) => setForm((prev) => ({ ...prev, newLabels: value }))}
            placeholder="Taip label dan tekan Enter"
            clearable
          />

          <Group justify="flex-end">
            <Button onClick={() => void handleSubmitTip()} loading={isSaving}>
              Simpan
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
