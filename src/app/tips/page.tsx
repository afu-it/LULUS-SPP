'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Anchor,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Modal,
  Skeleton,
  Stack,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { IconEdit, IconLink, IconPlus, IconTrash, IconTag, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { EmptyState } from '@/components/common/EmptyState';
import { formatRelativeTime } from '@/lib/date';
import { useAuth } from '@/hooks/useAuth';
import { useGuestName } from '@/hooks/useGuestName';
import type { TipItem, TipLabelItem } from '@/types/entities';

interface TipFormState {
  content: string;
  selectedLabelIds: string[];
  newLabels: string[];
  sourceLink: string;
}

const EMPTY_FORM: TipFormState = {
  content: '',
  selectedLabelIds: [],
  newLabels: [],
  sourceLink: '',
};

export default function TipsPage() {
  const { isAdmin } = useAuth();
  const { guestName, authorToken } = useGuestName();

  const [tips, setTips] = useState<TipItem[]>([]);
  const [labels, setLabels] = useState<TipLabelItem[]>([]);
  const [filterLabelId, setFilterLabelId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTip, setEditingTip] = useState<TipItem | null>(null);
  const [form, setForm] = useState<TipFormState>(EMPTY_FORM);

  const [newLabelInput, setNewLabelInput] = useState('');
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [isAddLabelOpen, setIsAddLabelOpen] = useState(false);

  async function loadLabels() {
    const response = await fetch('/api/labels', { cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to fetch labels');
    const data = (await response.json()) as { items?: TipLabelItem[] };
    setLabels(data.items ?? []);
  }

  async function loadTips(labelId = filterLabelId) {
    setIsLoading(true);
    try {
      const query = labelId ? `?labelId=${encodeURIComponent(labelId)}` : '';
      const response = await fetch(`/api/tips${query}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to fetch tips');
      const data = (await response.json()) as { items?: TipItem[] };
      setTips(data.items ?? []);
    } catch {
      notifications.show({ color: 'red', message: 'Tidak dapat memuat tips.' });
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
        notifications.show({ color: 'red', message: 'Tidak dapat memuat label tips.' });
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyFilter(nextLabelId: string) {
    setFilterLabelId(nextLabelId);
    await loadTips(nextLabelId);
  }

  async function handleAddNewLabel() {
    const name = newLabelInput.trim();
    if (!name) return;
    setIsAddingLabel(true);
    try {
      const res = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = (await res.json()) as { item: TipLabelItem };
      setLabels((prev) => {
        if (prev.find((l) => l.id === data.item.id)) return prev;
        return [...prev, data.item].sort((a, b) => a.name.localeCompare(b.name));
      });
      setNewLabelInput('');
      notifications.show({ color: 'green', message: `Label "${data.item.name}" ditambah.` });
    } catch {
      notifications.show({ color: 'red', message: 'Tidak dapat menambah label.' });
    } finally {
      setIsAddingLabel(false);
    }
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
      selectedLabelIds: tip.labels.map((label) => label.id),
      newLabels: [],
      sourceLink: tip.sourceLink ?? '',
    });
    setIsModalOpen(true);
  }

  async function handleSubmitTip() {
    if (!authorToken) {
      notifications.show({ color: 'red', message: 'Author token belum tersedia.' });
      return;
    }

    const payload = {
      content: form.content.trim(),
      labelIds: form.selectedLabelIds,
      newLabels: form.newLabels,
      sourceLink: form.sourceLink.trim() || undefined,
      authorToken,
      authorName: guestName || 'Tetamu',
    };

    if (!payload.content) {
      notifications.show({ color: 'red', message: 'Kandungan tip diperlukan.' });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(editingTip ? `/api/tips/${editingTip.id}` : '/api/tips', {
        method: editingTip ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Unable to save tip');
      notifications.show({ color: 'green', message: 'Tip berjaya disimpan.' });
      setIsModalOpen(false);
      setEditingTip(null);
      setForm(EMPTY_FORM);
      await loadLabels();
      await loadTips(filterLabelId);
    } catch {
      notifications.show({ color: 'red', message: 'Tidak dapat menyimpan tip.' });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteTip(tipId: string) {
    if (!authorToken) return;
    try {
      const response = await fetch(`/api/tips/${tipId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorToken }),
      });
      if (!response.ok) throw new Error('Unable to delete tip');
      setTips((prev) => prev.filter((tip) => tip.id !== tipId));
      notifications.show({ color: 'green', message: 'Tip berjaya dipadam.' });
    } catch {
      notifications.show({ color: 'red', message: 'Tidak dapat memadam tip.' });
    }
  }

  const allLabels = useMemo(() => labels, [labels]);

  function resolveCreditHref(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
    if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(trimmed) && !/\s/.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return '';
  }

  function resolveCreditLabel(value: string) {
    const raw = value.trim();
    const href = resolveCreditHref(raw);
    if (!href) return raw || 'Sumber';

    try {
      const hostname = new URL(href).hostname.replace(/^www\./i, '');
      const [domain] = hostname.split('.');
      return domain || raw || 'Sumber';
    } catch {
      return raw || 'Sumber';
    }
  }

  function toggleSelectedLabel(labelId: string) {
    setForm((prev) => {
      const isSelected = prev.selectedLabelIds.includes(labelId);
      const selectedLabelIds = isSelected
        ? prev.selectedLabelIds.filter((id) => id !== labelId)
        : [...prev.selectedLabelIds, labelId];

      return { ...prev, selectedLabelIds };
    });
  }

  function formatTipLabels(items: TipLabelItem[]) {
    return items.map((label) => label.name.toUpperCase()).join(', ');
  }

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

        {/* Filter by label */}
        <Box>
          <Text size="sm" fw={500} mb={8}>Filter label</Text>
          <Box style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[{ id: '', name: 'Semua' }, ...labels].map((label) => {
              const isActive = filterLabelId === label.id;
              return (
                <UnstyledButton
                  key={label.id || '__all'}
                  onClick={() => void applyFilter(label.id)}
                  style={{
                    padding: '2px 9px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    border: `1px solid ${isActive ? 'var(--mantine-primary-color-filled)' : 'var(--mantine-color-default-border)'}`,
                    background: isActive ? 'var(--mantine-primary-color-filled)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--mantine-color-text)',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label.name}
                </UnstyledButton>
              );
            })}
            <UnstyledButton
              onClick={() => setIsAddLabelOpen((prev) => !prev)}
              style={{
                padding: '2px 9px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px dashed var(--mantine-primary-color-filled)',
                background: 'transparent',
                color: 'var(--mantine-primary-color-filled)',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              + Label
            </UnstyledButton>
          </Box>

          {isAddLabelOpen && (
            <Group gap="xs" align="flex-end" mt="xs">
              <TextInput
                size="xs"
                placeholder="Nama label baharu..."
                value={newLabelInput}
                onChange={(e) => setNewLabelInput(e.currentTarget.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') void handleAddNewLabel(); }}
                leftSection={<IconTag size={14} />}
                style={{ flex: 1 }}
              />
              <Button
                size="xs"
                variant="light"
                loading={isAddingLabel}
                disabled={!newLabelInput.trim()}
                onClick={() => void handleAddNewLabel()}
              >
                Simpan
              </Button>
            </Group>
          )}
        </Box>

        <Divider />

        {isLoading ? (
          <Stack gap="sm">
            {[...Array(3)].map((_, index) => (
              <Box
                key={`tip-skeleton-${index}`}
                p="md"
                bg="#181818"
                style={{ borderRadius: 8, border: '1px solid var(--mantine-color-default-border)' }}
              >
                <Group wrap="nowrap" align="flex-start" gap="sm">
                  <Skeleton height={36} width={36} circle />
                  <Stack gap={8} style={{ flex: 1 }}>
                    <Skeleton height={12} width="62%" />
                    <Skeleton height={10} width="28%" />
                    <Skeleton height={10} width="94%" />
                    <Skeleton height={10} width="76%" />
                  </Stack>
                </Group>
              </Box>
            ))}
          </Stack>
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
                <Box key={tip.id} p="md" bg="#181818" style={{ borderRadius: 8, border: '1px solid var(--mantine-color-default-border)' }}>
                  <Group wrap="nowrap" align="flex-start" gap="sm">
                    <Avatar color="yellow" radius="xl" size="md">
                      {tip.authorName.charAt(0).toUpperCase() || 'T'}
                    </Avatar>
                    <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
                      <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <Stack gap={2}>
                          <Text fw={600} size="sm">
                            {tip.authorName}
                            {tip.labels.length > 0 ? ` > ${formatTipLabels(tip.labels)}` : ''}
                          </Text>
                          <Text size="xs" c="dimmed">{formatRelativeTime(tip.createdAt)}</Text>
                        </Stack>
                        {canManage && (
                          <Group gap={4}>
                            <ActionIcon variant="light" color="blue" onClick={() => openEditModal(tip)} aria-label="Edit tip">
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon variant="light" color="red" onClick={() => void handleDeleteTip(tip.id)} aria-label="Delete tip">
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        )}
                      </Group>
                      <Text size="sm" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                        {tip.content}
                      </Text>
                      {tip.sourceLink && (() => {
                        const raw = tip.sourceLink.trim();
                        const href = resolveCreditHref(raw);
                        const label = resolveCreditLabel(tip.sourceLink);
                        return (
                          <>
                            <Divider mt={3} mb={1} />
                            <Box ta="right">
                              <Text size="xs" c="#F3F5F7">
                                Kredit:{' '}
                                {href ? (
                                  <Anchor href={href} target="_blank" rel="noopener noreferrer" c="blue.4">
                                    {label}
                                  </Anchor>
                                ) : (
                                  <Text span c="#F3F5F7">{raw}</Text>
                                )}
                              </Text>
                            </Box>
                          </>
                        );
                      })()}
                    </Stack>
                  </Group>
                </Box>
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
        size="md"
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

          {/* Label selection */}
          <Box>
            <Text size="sm" fw={500} mb={8}>Pilih label</Text>
            <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, maxHeight: 220, overflowY: 'auto', paddingRight: 2 }}>
              {allLabels.map((label) => {
                const isSelected = form.selectedLabelIds.includes(label.id);
                return (
                  <UnstyledButton
                    key={label.id}
                    onClick={() => toggleSelectedLabel(label.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${isSelected ? 'var(--mantine-primary-color-filled)' : 'var(--mantine-color-default-border)'}`,
                      background: isSelected ? 'var(--mantine-primary-color-light)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                      minHeight: 40,
                    }}
                  >
                    <Text size="sm" fw={isSelected ? 600 : 400} style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {label.name}
                    </Text>
                    {isSelected && <IconCheck size={16} color="var(--mantine-primary-color-filled)" />}
                  </UnstyledButton>
                );
              })}
            </Box>
            <Text size="xs" c="dimmed" mt={6}>
              Boleh pilih lebih daripada satu label.
            </Text>
          </Box>

          {/* Add new labels inline */}
          <TagsInput
            label="Tambah label baharu (opsyenal)"
            value={form.newLabels}
            onChange={(value) => setForm((prev) => ({ ...prev, newLabels: value }))}
            placeholder="Taip label dan tekan Enter"
            clearable
          />

          <TextInput
            leftSection={<IconLink size={14} />}
            label="Kredit / Pautan Sumber (opsyenal)"
            placeholder="Contoh: https://maukerja.my/... atau Dr Rahman"
            value={form.sourceLink}
            onChange={(e) => setForm((prev) => ({ ...prev, sourceLink: e.currentTarget.value }))}
            size="sm"
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button onClick={() => void handleSubmitTip()} loading={isSaving}>
              Simpan
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
