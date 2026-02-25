'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Anchor,
  Box,
  Button,
  Container,
  Group,
  Menu,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core';
import {
  IconSun,
  IconMoon,
  IconDeviceDesktop,
  IconChevronDown,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useGuestName } from '@/hooks/useGuestName';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useI18n } from '@/hooks/useI18n';
import type { Locale } from '@/providers/I18nProvider';
import type { ThemeScheme } from '@/hooks/useDarkMode';

const THEME_OPTIONS: { value: ThemeScheme; labelKey: string; icon: React.ReactNode }[] = [
  { value: 'light', labelKey: 'settings.darkMode.light', icon: <IconSun size={15} /> },
  { value: 'dark', labelKey: 'settings.darkMode.dark', icon: <IconMoon size={15} /> },
  { value: 'auto', labelKey: 'settings.darkMode.auto', icon: <IconDeviceDesktop size={15} /> },
];

export default function SettingsPage() {
  const { locale, setLocale, t } = useI18n();
  const { guestName, setGuestName, isReady } = useGuestName();
  const { colorScheme, setTheme } = useDarkMode();
  const router = useRouter();

  const [guestNameDraft, setGuestNameDraft] = useState('');
  const [saved, setSaved] = useState(false);

  // 5-tap Easter egg on About section
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tapsLeft, setTapsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (isReady) setGuestNameDraft(guestName);
  }, [guestName, isReady]);

  function handleSaveGuestName() {
    setGuestName(guestNameDraft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleAboutTap() {
    tapCountRef.current += 1;
    const remaining = 5 - tapCountRef.current;

    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
      setTapsLeft(null);
    }, 3000);

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setTapsLeft(null);
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
      router.push('/admin-login');
    } else if (remaining <= 3) {
      setTapsLeft(remaining);
    }
  }

  const currentThemeOption = THEME_OPTIONS.find((o) => o.value === colorScheme) ?? THEME_OPTIONS[2];

  return (
    <Container py="xl">
      <Stack gap="md">
        {/* Header row */}
        <Group justify="space-between" align="center" wrap="nowrap">
          <Title order={2}>{t('settings.title')}</Title>

          <Group gap="xs" wrap="nowrap">
            <SegmentedControl
              size="xs"
              value={locale}
              onChange={(value) => setLocale(value as Locale)}
              data={[
                { label: 'BM', value: 'ms' },
                { label: 'EN', value: 'en' },
              ]}
            />

            {/* Theme dropdown */}
            <Menu shadow="md" width={180} position="bottom-end">
              <Menu.Target>
                <UnstyledButton
                  aria-label={t('settings.darkMode.label')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--mantine-color-default-border)',
                    fontSize: 13,
                    color: 'var(--mantine-color-text)',
                    cursor: 'pointer',
                  }}
                >
                  {currentThemeOption.icon}
                  <IconChevronDown size={13} />
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                {THEME_OPTIONS.map((opt) => (
                  <Menu.Item
                    key={opt.value}
                    leftSection={opt.icon}
                    onClick={() => setTheme(opt.value)}
                    fw={colorScheme === opt.value ? 700 : 400}
                    color={colorScheme === opt.value ? 'brand' : undefined}
                  >
                    {t(opt.labelKey)}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>

        {/* Guest identity */}
        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Title order={4}>{t('settings.guest.title')}</Title>

            <TextInput
              label={t('settings.guest.nameLabel')}
              placeholder={t('settings.guest.namePlaceholder')}
              value={guestNameDraft}
              onChange={(e) => setGuestNameDraft(e.currentTarget.value)}
            />

            <Button onClick={handleSaveGuestName} color={saved ? 'green' : undefined}>
              {saved ? t('settings.success.title') + '!' : t('settings.guest.save')}
            </Button>

            {!isReady && <Text size="xs" c="dimmed">{t('settings.status.checking')}</Text>}
          </Stack>
        </Paper>

        {/* About — 5-tap secret */}
        <Paper
          withBorder
          p="md"
          radius="md"
          style={{ cursor: 'pointer', userSelect: 'none' }}
          onClick={handleAboutTap}
        >
          <Stack gap="xs">
            <Title order={4}>{t('settings.about.title')}</Title>
            <Text size="sm" c="dimmed">{t('settings.about.body')}</Text>
            {tapsLeft !== null && (
              <Text size="xs" c="dimmed" ta="center">
                {t('settings.about.taps').replace('{n}', String(tapsLeft))}
              </Text>
            )}
          </Stack>
        </Paper>

      </Stack>

      {/* Footer contact */}
      <Box mt="xl" pt="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
        <Text size="xs" c="dimmed" ta="center">{t('settings.contact.title')}</Text>
        <Text size="xs" c="dimmed" ta="center" mt={4}>{t('settings.contact.body')}</Text>
        <Box ta="center" mt={6}>
          <Anchor
            href="https://wa.me/+601126101206"
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            fw={500}
            c="green"
          >
            {t('settings.contact.whatsapp')}
          </Anchor>
        </Box>
      </Box>
    </Container>
  );
}
