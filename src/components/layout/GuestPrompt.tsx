'use client';

import { useState, useEffect } from 'react';
import { Modal, TextInput, Button, Text, Stack } from '@mantine/core';
import { useGuestName } from '@/hooks/useGuestName';
import { useAuth } from '@/hooks/useAuth';

function formatRemainingTime(remainingMs: number) {
  const hours = Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000)));

  if (hours >= 24) {
    const days = Math.ceil(hours / 24);
    return `${days} hari`;
  }

  return `${hours} jam`;
}

export function GuestPrompt() {
  const { guestName, setGuestName, isReady } = useGuestName();
  const { isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Show modal if we are ready and the guestName is exactly empty
  useEffect(() => {
    if (isReady && !guestName) {
      setIsOpen(true);
    }
  }, [isReady, guestName]);

  const handleSubmit = () => {
    if (draftName.trim().length > 0) {
      const result = setGuestName(draftName.trim(), { isAdmin });

      if (!result.ok) {
        if (result.code === 'reserved') {
          setSaveError('Nama "ADMIN" hanya untuk pentadbir.');
        } else if (result.code === 'same') {
          setSaveError('Nama paparan sama seperti nama semasa (tidak sensitif huruf besar/kecil).');
        } else if (result.code === 'locked') {
          const remainingLabel = formatRemainingTime(result.remainingMs ?? 0);
          setSaveError(`Nama paparan hanya boleh ditukar setiap 3 hari. Cuba lagi dalam ${remainingLabel}.`);
        } else {
          setSaveError('Nama paparan diperlukan.');
        }
        return;
      }

      setSaveError(null);
      setIsOpen(false);
    }
  };

  return (
    <Modal
      opened={isOpen}
      onClose={() => setIsOpen(false)}
      withCloseButton={true}
      centered
      closeOnClickOutside={true}
      closeOnEscape={true}
      title={
        <Text fw={700} size="lg">
          Selamat Datang!
        </Text>
      }
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Sila masukkan nama paparan (display name) pilihan anda sebelum meneruskan.
        </Text>
        <TextInput
          placeholder="Nama anda..."
          value={draftName}
          onChange={(e) => setDraftName(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          autoFocus
          data-autofocus
        />
        <Button onClick={handleSubmit} disabled={draftName.trim().length === 0} fullWidth>
          Simpan Nama
        </Button>
        {saveError && (
          <Text size="xs" c="red.6">
            {saveError}
          </Text>
        )}
        <Button variant="subtle" color="gray" size="xs" fullWidth onClick={() => setIsOpen(false)}>
          Langkau (boleh tukar kemudian di Tetapan)
        </Button>
      </Stack>
    </Modal>
  );
}
