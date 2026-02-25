'use client';

import { useState, useEffect } from 'react';
import { Modal, TextInput, Button, Text, Stack } from '@mantine/core';
import { useGuestName } from '@/hooks/useGuestName';

export function GuestPrompt() {
  const { guestName, setGuestName, isReady } = useGuestName();
  const [isOpen, setIsOpen] = useState(false);
  const [draftName, setDraftName] = useState('');

  // Show modal if we are ready and the guestName is exactly empty
  useEffect(() => {
    if (isReady && !guestName) {
      setIsOpen(true);
    }
  }, [isReady, guestName]);

  const handleSubmit = () => {
    if (draftName.trim().length > 0) {
      setGuestName(draftName.trim());
      setIsOpen(false);
    }
  };

  return (
    <Modal
      opened={isOpen}
      onClose={() => {}} // Force user to fill it out
      withCloseButton={false}
      centered
      closeOnClickOutside={false}
      closeOnEscape={false}
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
      </Stack>
    </Modal>
  );
}
