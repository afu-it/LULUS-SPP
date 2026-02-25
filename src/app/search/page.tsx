'use client';

import { useState, useEffect } from 'react';
import { Container, TextInput, Stack, Text, Box, ActionIcon, Loader, Badge, Group, Avatar } from '@mantine/core';
import { IconSearch, IconArrowLeft } from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatRelativeTime } from '@/lib/date';

interface SearchResults {
  posts: any[];
  notes: any[];
  tips: any[];
  soalan: any[];
  caraDaftar: any[];
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 500);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setResults(data as SearchResults);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const hasResults =
    results &&
    (results.posts.length > 0 ||
      results.notes.length > 0 ||
      results.tips.length > 0 ||
      results.soalan.length > 0 ||
      results.caraDaftar.length > 0);

  return (
    <Container px={0} py={0} pos="relative" style={{ minHeight: '100vh', backgroundColor: 'var(--mantine-color-body)' }}>
      {/* Sticky Header */}
      <Box
        pos="sticky"
        top={0}
        bg="var(--mantine-color-body)"
        style={{ zIndex: 100, borderBottom: '1px solid var(--mantine-color-default-border)' }}
        px="md"
        py="sm"
      >
        <Group wrap="nowrap" align="center" gap="sm">
          <ActionIcon variant="subtle" color="gray" size="lg" onClick={() => router.back()}>
            <IconArrowLeft size={22} />
          </ActionIcon>
          <TextInput
            flex={1}
            placeholder="Search LULUS SPP..."
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            variant="filled"
            autoFocus
            radius="md"
          />
        </Group>
      </Box>

      {/* Content */}
      <Box p="md">
        {loading && (
          <Group justify="center" mt="xl">
            <Loader color="brand" type="dots" />
          </Group>
        )}

        {error && (
          <Text c="red" size="sm" ta="center" mt="xl">
            {error}
          </Text>
        )}

        {!loading && !error && query.trim() !== '' && !hasResults && results && (
          <Text c="dimmed" size="sm" ta="center" mt="xl">
            Tiada hasil carian untuk "{query}".
          </Text>
        )}

        {!loading && !error && hasResults && (
          <Stack gap="xl">
            {/* Posts */}
            {results.posts.length > 0 && (
              <Stack gap="sm">
                <Text fw={700} size="sm" c="dimmed">POSTS</Text>
                {results.posts.map((post) => (
                  <Box key={post.id} bg="#181818" p="md" style={{ borderRadius: 8 }}>
                    <Group wrap="nowrap" align="flex-start" gap="sm">
                      <Avatar color="blue" radius="xl" size="md">
                        {post.authorName?.charAt(0).toUpperCase() || 'P'}
                      </Avatar>
                      <Stack gap={4} style={{ flex: 1 }}>
                        <Group gap={6} align="center">
                          <Text size="sm" fw={600}>{post.authorName}</Text>
                          <Text size="xs" c="dimmed">{formatRelativeTime(post.createdAt)}</Text>
                        </Group>
                        <Text size="sm" lineClamp={3}>{post.content}</Text>
                      </Stack>
                    </Group>
                  </Box>
                ))}
              </Stack>
            )}

            {/* Notes */}
            {results.notes.length > 0 && (
              <Stack gap="sm">
                <Text fw={700} size="sm" c="dimmed">NOTA SPP</Text>
                {results.notes.map((note) => (
                  <Box key={note.id} bg="#181818" p="md" style={{ borderRadius: 8 }}>
                    <Group wrap="nowrap" align="flex-start" gap="sm">
                      <Avatar color="grape" radius="xl" size="md">
                        {note.authorName?.charAt(0).toUpperCase() || 'N'}
                      </Avatar>
                      <Stack gap={4} style={{ flex: 1 }}>
                        <Group gap={6} align="center">
                          <Text size="sm" fw={600}>{note.authorName}</Text>
                          <Text size="xs" c="dimmed">{formatRelativeTime(note.createdAt)}</Text>
                        </Group>
                        <Text size="sm" fw={600} lineClamp={1} mt={2}>{note.title}</Text>
                        <Text size="sm" lineClamp={3}>{note.content}</Text>
                      </Stack>
                    </Group>
                  </Box>
                ))}
              </Stack>
            )}

            {/* Tips */}
            {results.tips.length > 0 && (
              <Stack gap="sm">
                <Text fw={700} size="sm" c="dimmed">TIPS SPP</Text>
                {results.tips.map((tip) => (
                  <Box key={tip.id} bg="#181818" p="md" style={{ borderRadius: 8 }}>
                    <Group wrap="nowrap" align="flex-start" gap="sm">
                      <Avatar color="yellow" radius="xl" size="md">
                        {tip.authorName?.charAt(0).toUpperCase() || 'T'}
                      </Avatar>
                      <Stack gap={4} style={{ flex: 1 }}>
                        <Group gap={6} align="center">
                          <Text size="sm" fw={600}>{tip.authorName}</Text>
                          <Text size="xs" c="dimmed">{formatRelativeTime(tip.createdAt)}</Text>
                        </Group>
                        <Text size="sm" lineClamp={3}>{tip.content}</Text>
                      </Stack>
                    </Group>
                  </Box>
                ))}
              </Stack>
            )}

            {/* Soalan */}
            {results.soalan.length > 0 && (
              <Stack gap="sm">
                <Text fw={700} size="sm" c="dimmed">SOALAN IV</Text>
                {results.soalan.map((item) => (
                  <Box key={item.id} bg="#181818" p="md" style={{ borderRadius: 8 }}>
                    <Group wrap="nowrap" align="flex-start" gap="sm">
                      <Avatar color="teal" radius="xl" size="md">
                        {item.authorName?.charAt(0).toUpperCase() || 'S'}
                      </Avatar>
                      <Stack gap={4} style={{ flex: 1 }}>
                        <Group gap={6} align="center">
                          <Text size="sm" fw={600}>{item.authorName}</Text>
                          <Text size="xs" c="dimmed">{formatRelativeTime(item.createdAt)}</Text>
                        </Group>
                        <Badge size="xs" color="blue" mt={2}>{item.bidang?.name || 'Umum'}</Badge>
                        <Text size="sm" lineClamp={3}>{item.content}</Text>
                      </Stack>
                    </Group>
                  </Box>
                ))}
              </Stack>
            )}

             {/* Cara Daftar */}
             {results.caraDaftar.length > 0 && (
              <Stack gap="sm">
                <Text fw={700} size="sm" c="dimmed">CARA DAFTAR</Text>
                {results.caraDaftar.map((step) => (
                  <Box key={step.id} bg="#181818" p="md" style={{ borderRadius: 8 }}>
                    <Text size="sm" fw={600}>Langkah {step.stepNo}: {step.title}</Text>
                    <Text size="sm" mt={4} lineClamp={3}>{step.content}</Text>
                  </Box>
                ))}
              </Stack>
            )}

          </Stack>
        )}
      </Box>
    </Container>
  );
}
