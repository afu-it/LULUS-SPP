'use client';

import { useCallback, useEffect, useState } from 'react';

const GUEST_NAME_STORAGE_KEY = 'lulus-spp:guest-name';
const AUTHOR_TOKEN_STORAGE_KEY = 'lulus-spp:author-token';

function generateAuthorToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useGuestName() {
  const [guestName, setGuestNameState] = useState('');
  const [authorToken, setAuthorTokenState] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedGuestName = window.localStorage.getItem(GUEST_NAME_STORAGE_KEY) ?? '';
    const storedAuthorToken = window.localStorage.getItem(AUTHOR_TOKEN_STORAGE_KEY);

    const resolvedAuthorToken = storedAuthorToken ?? generateAuthorToken();

    if (!storedAuthorToken) {
      window.localStorage.setItem(AUTHOR_TOKEN_STORAGE_KEY, resolvedAuthorToken);
    }

    setGuestNameState(storedGuestName);
    setAuthorTokenState(resolvedAuthorToken);
    setIsReady(true);
  }, []);

  const setGuestName = useCallback((value: string) => {
    const normalizedName = value.trim();
    setGuestNameState(normalizedName);
    window.localStorage.setItem(GUEST_NAME_STORAGE_KEY, normalizedName);
  }, []);

  return {
    guestName,
    setGuestName,
    authorToken,
    isReady,
  };
}
