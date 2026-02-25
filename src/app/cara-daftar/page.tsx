'use client';

import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Anchor,
  Button,
  Container,
  Group,
  Modal,
  NumberInput,
  Paper,
  Skeleton,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import type { CaraDaftarStepItem } from '@/types/entities';

interface StepFormState {
  stepNo: number;
  title: string;
  content: string;
  linkUrl: string;
}

const EMPTY_FORM: StepFormState = {
  stepNo: 1,
  title: '',
  content: '',
  linkUrl: '',
};

export default function CaraDaftarPage() {
  const { isAdmin } = useAuth();

  const [steps, setSteps] = useState<CaraDaftarStepItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingStep, setEditingStep] = useState<CaraDaftarStepItem | null>(null);
  const [form, setForm] = useState<StepFormState>(EMPTY_FORM);

  async function loadSteps() {
    setIsLoading(true);

    try {
      const response = await fetch('/api/cara-daftar', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Unable to fetch steps');
      }

      const data = (await response.json()) as { items?: CaraDaftarStepItem[] };
      setSteps(data.items ?? []);
    } catch {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat memuat langkah daftar.' });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSteps();
  }, []);

  function openCreateModal() {
    const nextStepNo = steps.length > 0 ? Math.max(...steps.map((step) => step.stepNo)) + 1 : 1;
    setEditingStep(null);
    setForm({ ...EMPTY_FORM, stepNo: nextStepNo });
    setIsModalOpen(true);
  }

  function openEditModal(step: CaraDaftarStepItem) {
    setEditingStep(step);
    setForm({
      stepNo: step.stepNo,
      title: step.title,
      content: step.content,
      linkUrl: step.linkUrl ?? '',
    });
    setIsModalOpen(true);
  }

  async function handleSaveStep() {
    const payload = {
      stepNo: Number(form.stepNo),
      title: form.title.trim(),
      content: form.content.trim(),
      linkUrl: form.linkUrl.trim(),
    };

    if (!payload.stepNo || !payload.title || !payload.content) {
      notifications.show({
        color: 'red',
        title: 'Ralat',
        message: 'Nombor langkah, tajuk, dan kandungan wajib diisi.',
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(editingStep ? `/api/cara-daftar/${editingStep.id}` : '/api/cara-daftar', {
        method: editingStep ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Unable to save step');
      }

      notifications.show({ color: 'green', title: 'Berjaya', message: 'Langkah berjaya disimpan.' });
      setIsModalOpen(false);
      setEditingStep(null);
      setForm(EMPTY_FORM);
      await loadSteps();
    } catch {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat menyimpan langkah.' });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteStep(stepId: string) {
    try {
      const response = await fetch(`/api/cara-daftar/${stepId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Unable to delete step');
      }

      setSteps((prev) => prev.filter((step) => step.id !== stepId));
      notifications.show({ color: 'green', title: 'Berjaya', message: 'Langkah berjaya dipadam.' });
    } catch {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat memadam langkah.' });
    }
  }

  return (
    <Container py="md">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2}>CARA DAFTAR SPP</Title>
            <Text size="sm" c="dimmed">
              Panduan langkah demi langkah untuk proses pendaftaran SPP.
            </Text>
          </div>

          {isAdmin && (
            <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
              Tambah Langkah
            </Button>
          )}
        </Group>

        {isLoading ? (
          <Stack gap="sm">
            {[...Array(3)].map((_, index) => (
              <Paper key={`step-skeleton-${index}`} withBorder p="md" radius="md" bg="#181818">
                <Stack gap={8}>
                  <Skeleton height={10} width="28%" />
                  <Skeleton height={14} width="62%" />
                  <Skeleton height={10} width="94%" />
                  <Skeleton height={10} width="70%" />
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : steps.length === 0 ? (
          <EmptyState
            title="Tiada langkah tersedia"
            description={
              isAdmin
                ? 'Tambah langkah pertama untuk memulakan panduan.'
                : 'Admin belum menerbitkan kandungan untuk halaman ini.'
            }
          />
        ) : (
          <Stack gap="sm">
            {steps.map((step) => (
              <Paper key={step.id} withBorder p="md" radius="md" bg="#181818">
                <Stack gap={8}>
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <div>
                      <Text size="xs" c="dimmed">
                        Langkah {step.stepNo}
                      </Text>
                      <Title order={4}>{step.title}</Title>
                    </div>

                    {isAdmin && (
                      <Group gap={4}>
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => openEditModal(step)}
                          aria-label="Edit step"
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => void handleDeleteStep(step.id)}
                          aria-label="Delete step"
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    )}
                  </Group>

                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {step.content}
                  </Text>

                  {step.linkUrl && (
                    <Anchor href={step.linkUrl} target="_blank" rel="noreferrer" size="sm">
                      {step.linkUrl}
                    </Anchor>
                  )}
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>

      <Modal
        opened={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStep ? 'Kemaskini Langkah' : 'Tambah Langkah Baharu'}
        centered
      >
        <Stack>
          <NumberInput
            label="Nombor Langkah"
            min={1}
            value={form.stepNo}
            onChange={(value) => setForm((prev) => ({ ...prev, stepNo: Number(value) || 1 }))}
          />

          <TextInput
            label="Tajuk"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.currentTarget.value }))}
            required
          />

          <Textarea
            label="Kandungan"
            minRows={4}
            autosize
            value={form.content}
            onChange={(event) => setForm((prev) => ({ ...prev, content: event.currentTarget.value }))}
            required
          />

          <TextInput
            label="Pautan (optional)"
            placeholder="https://..."
            value={form.linkUrl}
            onChange={(event) => setForm((prev) => ({ ...prev, linkUrl: event.currentTarget.value }))}
          />

          <Group justify="flex-end">
            <Button onClick={() => void handleSaveStep()} loading={isSaving}>
              Simpan
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
