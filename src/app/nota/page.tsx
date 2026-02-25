'use client';

import { useEffect, useState } from 'react';
import {
  ActionIcon,
  Anchor,
  Button,
  Container,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { IconEdit, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDateTime } from '@/lib/date';
import { useAuth } from '@/hooks/useAuth';
import { useGuestName } from '@/hooks/useGuestName';
import type { NoteItem } from '@/types/entities';

interface NoteFormState {
  title: string;
  content: string;
  link: string;
}

const EMPTY_FORM: NoteFormState = {
  title: '',
  content: '',
  link: '',
};

export default function NotaPage() {
  const { isAdmin } = useAuth();
  const { guestName, authorToken } = useGuestName();

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [form, setForm] = useState<NoteFormState>(EMPTY_FORM);

  async function loadNotes(query = '') {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/notes?q=${encodeURIComponent(query)}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Unable to fetch notes');
      }

      const data = (await response.json()) as { items?: NoteItem[] };
      setNotes(data.items ?? []);
    } catch {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat memuat nota.' });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadNotes();
  }, []);

  function openCreateModal() {
    setEditingNote(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  }

  function openEditModal(note: NoteItem) {
    setEditingNote(note);
    setForm({
      title: note.title,
      content: note.content,
      link: note.link ?? '',
    });
    setIsModalOpen(true);
  }

  async function handleSubmitNote() {
    if (!authorToken) {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Author token belum tersedia.' });
      return;
    }

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      link: form.link.trim(),
      authorToken,
      authorName: guestName || 'Tetamu',
    };

    if (!payload.title || !payload.content) {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tajuk dan kandungan wajib diisi.' });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(editingNote ? `/api/notes/${editingNote.id}` : '/api/notes', {
        method: editingNote ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Unable to save note');
      }

      notifications.show({ color: 'green', title: 'Berjaya', message: 'Nota berjaya disimpan.' });
      setIsModalOpen(false);
      setEditingNote(null);
      setForm(EMPTY_FORM);
      await loadNotes(search);
    } catch {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat menyimpan nota.' });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!authorToken) {
      return;
    }

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorToken }),
      });

      if (!response.ok) {
        throw new Error('Unable to delete note');
      }

      setNotes((prev) => prev.filter((note) => note.id !== noteId));
      notifications.show({ color: 'green', title: 'Berjaya', message: 'Nota berjaya dipadam.' });
    } catch {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat memadam nota.' });
    }
  }

  function canManage(note: NoteItem) {
    return isAdmin || (authorToken ? note.authorToken === authorToken : false);
  }

  return (
    <Container py="md">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2}>NOTA SPP</Title>
            <Text size="sm" c="dimmed">
              Simpan nota ringkas dan pautan rujukan anda.
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
            Tambah Nota
          </Button>
        </Group>

        <TextInput
          leftSection={<IconSearch size={16} />}
          value={search}
          placeholder="Cari nota berdasarkan tajuk atau kandungan"
          onChange={(event) => setSearch(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void loadNotes(search);
            }
          }}
          rightSection={
            <Button size="compact-xs" variant="subtle" onClick={() => void loadNotes(search)}>
              Cari
            </Button>
          }
        />

        {isLoading ? (
          <Group justify="center" py="xl">
            <Loader />
          </Group>
        ) : notes.length === 0 ? (
          <EmptyState
            title="Tiada nota ditemui"
            description="Tambah nota pertama anda atau ubah kata carian."
          />
        ) : (
          <Stack gap="sm">
            {notes.map((note) => (
              <Paper key={note.id} withBorder p="md" radius="md">
                <Stack gap={6}>
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <div>
                      <Title order={4}>{note.title}</Title>
                      <Text size="xs" c="dimmed">
                        Oleh {note.authorName} • {formatDateTime(note.createdAt)}
                      </Text>
                    </div>

                    {canManage(note) && (
                      <Group gap={4}>
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => openEditModal(note)}
                          aria-label="Edit note"
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="light"
                          color="red"
                          onClick={() => void handleDeleteNote(note.id)}
                          aria-label="Delete note"
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    )}
                  </Group>

                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {note.content}
                  </Text>

                  {note.link && (
                    <Anchor href={note.link} target="_blank" rel="noreferrer" size="sm">
                      {note.link}
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
        title={editingNote ? 'Kemaskini Nota' : 'Tambah Nota Baharu'}
        centered
      >
        <Stack>
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
            value={form.link}
            onChange={(event) => setForm((prev) => ({ ...prev, link: event.currentTarget.value }))}
          />

          <Group justify="flex-end">
            <Button onClick={() => void handleSubmitNote()} loading={isSaving}>
              Simpan
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
