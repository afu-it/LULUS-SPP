'use client';

import { useCallback, useEffect, useState } from 'react';

const GUEST_NAME_STORAGE_KEY = 'lulus-spp:guest-name';
const AUTHOR_TOKEN_STORAGE_KEY = 'lulus-spp:author-token';
const GUEST_NAME_CHANGED_AT_STORAGE_KEY = 'lulus-spp:guest-name-changed-at';
const RESERVED_ADMIN_DISPLAY_NAME = 'admin';
export const GUEST_NAME_CHANGE_LOCK_MS = 3 * 24 * 60 * 60 * 1000;

type SetGuestNameErrorCode = 'required' | 'reserved' | 'locked' | 'same';

interface SetGuestNameResult {
  ok: boolean;
  code?: SetGuestNameErrorCode;
  remainingMs?: number;
}

interface SetGuestNameOptions {
  isAdmin?: boolean;
}

function normalizeDisplayName(value: string) {
  return value.trim().toLowerCase();
}

function calculateRemainingMs(lastChangedAt: number | null) {
  if (!lastChangedAt) {
    return 0;
  }

  const elapsed = Date.now() - lastChangedAt;
  return Math.max(GUEST_NAME_CHANGE_LOCK_MS - elapsed, 0);
}

function generateAuthorToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useGuestName() {
  const [guestName, setGuestNameState] = useState('');
  const [authorToken, setAuthorTokenState] = useState('');
  const [lastChangedAt, setLastChangedAt] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedGuestName = window.localStorage.getItem(GUEST_NAME_STORAGE_KEY) ?? '';
    const storedAuthorToken = window.localStorage.getItem(AUTHOR_TOKEN_STORAGE_KEY);
    const storedChangedAt = window.localStorage.getItem(GUEST_NAME_CHANGED_AT_STORAGE_KEY);

    let resolvedLastChangedAt: number | null = null;
    if (storedChangedAt) {
      const parsed = Number(storedChangedAt);
      if (Number.isFinite(parsed) && parsed > 0) {
        resolvedLastChangedAt = parsed;
      }
    }

    const resolvedAuthorToken = storedAuthorToken ?? generateAuthorToken();

    if (!storedAuthorToken) {
      window.localStorage.setItem(AUTHOR_TOKEN_STORAGE_KEY, resolvedAuthorToken);
    }

    setGuestNameState(storedGuestName);
    setAuthorTokenState(resolvedAuthorToken);
    setLastChangedAt(resolvedLastChangedAt);
    setIsReady(true);
  }, []);

  const setGuestName = useCallback((value: string, options?: SetGuestNameOptions): SetGuestNameResult => {
    const normalizedName = value.trim();
    const isAdminActor = Boolean(options?.isAdmin);

    if (!normalizedName) {
      return { ok: false, code: 'required' };
    }

    const normalizedNameKey = normalizeDisplayName(normalizedName);
    if (!isAdminActor && normalizedNameKey === RESERVED_ADMIN_DISPLAY_NAME) {
      return { ok: false, code: 'reserved' };
    }

    const currentNameKey = normalizeDisplayName(guestName);
    if (currentNameKey && currentNameKey === normalizedNameKey) {
      return { ok: false, code: 'same' };
    }

    if (!isAdminActor) {
      const remainingMs = calculateRemainingMs(lastChangedAt);
      if (remainingMs > 0) {
        return { ok: false, code: 'locked', remainingMs };
      }
    }

    const now = Date.now();
    setGuestNameState(normalizedName);
    window.localStorage.setItem(GUEST_NAME_STORAGE_KEY, normalizedName);
    window.localStorage.setItem(GUEST_NAME_CHANGED_AT_STORAGE_KEY, String(now));
    setLastChangedAt(now);

    return { ok: true };
  }, [guestName, lastChangedAt]);

  const displayNameChangeRemainingMs = calculateRemainingMs(lastChangedAt);

  return {
    guestName,
    setGuestName,
    authorToken,
    displayNameChangeRemainingMs,
    isReady,
  };
}
