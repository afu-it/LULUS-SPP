'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Container,
  Group,
  Paper,
  PasswordInput,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useGuestName } from '@/hooks/useGuestName';
import { useI18n } from '@/hooks/useI18n';
import type { Locale } from '@/providers/I18nProvider';

interface FeedbackMessage {
  tone: 'error' | 'success';
  text: string;
}

function mapAuthErrorToMessage(rawError: string | undefined, t: (key: string) => string) {
  const normalized = (rawError ?? '').toLowerCase();

  if (normalized.includes('invalid username') || normalized.includes('invalid username or password')) {
    return t('settings.auth.invalid');
  }

  return t('settings.auth.error');
}

export default function SettingsPage() {
  const { locale, setLocale, t } = useI18n();
  const { isLoading, isAdmin, adminUsername, login, logout } = useAuth();
  const { guestName, setGuestName, authorToken, isReady } = useGuestName();
  const { isDark, toggle } = useDarkMode();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [guestNameDraft, setGuestNameDraft] = useState('');
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  useEffect(() => {
    if (isReady) {
      setGuestNameDraft(guestName);
    }
  }, [guestName, isReady]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = await login(username.trim(), password);

    if (!result.ok) {
      setFeedback({
        tone: 'error',
        text: mapAuthErrorToMessage(result.error, t),
      });
      return;
    }

    setPassword('');
    setFeedback({
      tone: 'success',
      text: t('settings.auth.loginSuccess'),
    });
  }

  async function handleLogout() {
    await logout();
    setFeedback({
      tone: 'success',
      text: t('settings.auth.logoutSuccess'),
    });
  }

  function handleSaveGuestName() {
    setGuestName(guestNameDraft);
    setFeedback({
      tone: 'success',
      text: t('settings.guest.saved'),
    });
  }

  return (
    <Container py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="nowrap">
          <Title order={2}>{t('settings.title')}</Title>
          <Group gap="xs" wrap="nowrap">
            <Text size="sm" c="dimmed">
              {t('settings.darkMode.title')}: {isDark ? t('settings.darkMode.on') : t('settings.darkMode.off')}
            </Text>
            <Switch
              size="md"
              checked={isDark}
              onChange={() => toggle()}
              aria-label={t('settings.darkMode.label')}
            />
          </Group>
        </Group>

        {isLoading && (
          <Text size="sm" c="dimmed">
            {t('settings.status.checking')}
          </Text>
        )}

        {feedback && (
          <Alert
            color={feedback.tone === 'error' ? 'red' : 'green'}
            icon={
              feedback.tone === 'error' ? (
                <IconAlertCircle size={16} />
              ) : (
                <IconCheck size={16} />
              )
            }
            title={
              feedback.tone === 'error'
                ? t('settings.error.title')
                : t('settings.success.title')
            }
          >
            {feedback.text}
          </Alert>
        )}

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Group justify="space-between">
              <Title order={4}>{t('settings.auth.title')}</Title>
              <Badge color={isAdmin ? 'green' : 'gray'}>
                {t('settings.auth.mode')}:{' '}
                {isAdmin ? t('settings.auth.modeAdmin') : t('settings.auth.modeGuest')}
              </Badge>
            </Group>

            {isAdmin ? (
              <Stack gap="sm">
                <Text size="sm" c="dimmed">
                  {adminUsername || 'admin'}
                </Text>
                <Button onClick={handleLogout} loading={isLoading} variant="outline" color="red">
                  {t('settings.auth.logout')}
                </Button>
              </Stack>
            ) : (
              <form onSubmit={handleLogin}>
                <Stack gap="sm">
                  <TextInput
                    label={t('settings.auth.username')}
                    value={username}
                    onChange={(event) => setUsername(event.currentTarget.value)}
                    required
                  />
                  <PasswordInput
                    label={t('settings.auth.password')}
                    value={password}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                    required
                  />
                  <Button type="submit" loading={isLoading}>
                    {isLoading ? t('settings.auth.loggingIn') : t('settings.auth.login')}
                  </Button>
                </Stack>
              </form>
            )}
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Title order={4}>{t('settings.guest.title')}</Title>

            <TextInput
              label={t('settings.guest.nameLabel')}
              placeholder={t('settings.guest.namePlaceholder')}
              value={guestNameDraft}
              onChange={(event) => setGuestNameDraft(event.currentTarget.value)}
            />

            <Button onClick={handleSaveGuestName}>{t('settings.guest.save')}</Button>

            <TextInput
              label={t('settings.guest.tokenLabel')}
              value={authorToken}
              readOnly
              description={isReady ? undefined : t('settings.status.checking')}
            />
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Title order={4}>{t('settings.language.title')}</Title>
            <Text size="sm" c="dimmed">
              {t('settings.language.label')}
            </Text>

            <SegmentedControl
              fullWidth
              value={locale}
              onChange={(value) => setLocale(value as Locale)}
              data={[
                { label: t('settings.language.ms'), value: 'ms' },
                { label: t('settings.language.en'), value: 'en' },
              ]}
            />
          </Stack>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Stack gap="sm">
            <Title order={4}>{t('settings.about.title')}</Title>
            <Text size="sm" c="dimmed">
              {t('settings.about.body')}
            </Text>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
