'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Menu,
  Modal,
  Paper,
  Skeleton,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { 
  IconBookmark,
  IconDots,
  IconHeart,
  IconLink,
  IconMessageCircle, 
  IconMessagePlus, 
  IconPin, 
  IconRepeat,
  IconSearch, 
  IconThumbUp, 
  IconTrash,
  IconUserCircle,
  IconBell,
  IconX
} from '@tabler/icons-react';
import { useWindowScroll } from '@mantine/hooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { EmptyState } from '@/components/common/EmptyState';
import { FAB } from '@/components/common/FAB';
import { formatDateTime, formatRelativeTime } from '@/lib/date';
import { useAuth } from '@/hooks/useAuth';
import { useGuestName } from '@/hooks/useGuestName';
import type { CommentItem, PostItem } from '@/types/entities';

const POSTS_PAGE_SIZE = 10;
const LIKED_POSTS_STORAGE_KEY = 'lulus-spp:liked-posts';
const REPOSTED_POSTS_STORAGE_KEY = 'lulus-spp:reposted-posts';
const DISMISSED_BANNER_KEY = 'lulus-spp:dismissed-banner';

function sortPosts(items: PostItem[]) {
  return [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

type StatusOption = 'online' | 'busy' | 'offline';

const STATUS_COLORS: Record<StatusOption, string> = {
  online: '#22c55e',
  busy: '#f59e0b',
  offline: '#6b7280',
};

const STATUS_KEY = 'lulus-spp:status';

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

export default function HomePage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { guestName, authorToken, isReady: isGuestReady } = useGuestName();

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommentItem[]>>({});
  const [expandedPostIds, setExpandedPostIds] = useState<Record<string, boolean>>({});
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [repostedPostIds, setRepostedPostIds] = useState<string[]>([]);

  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [postOffset, setPostOffset] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [loadingCommentsByPost, setLoadingCommentsByPost] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<StatusOption>('online');

  // Sticky banner
  const [banner, setBanner] = useState<{ id: string; content: string } | null>(null);
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  const [scroll] = useWindowScroll();
  const lastScrollYRef = useRef(0);
  const [showFAB, setShowFAB] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(STATUS_KEY) as StatusOption | null;
    if (stored && stored in STATUS_COLORS) setStatus(stored);
  }, []);

  // Fetch banner
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/banner');
        if (res.ok) {
          const data = (await res.json()) as { item: { id: string; content: string } | null };
          if (data.item) {
            const dismissed = window.localStorage.getItem(DISMISSED_BANNER_KEY);
            if (dismissed !== data.item.id) {
              setBanner(data.item);
              setIsBannerVisible(true);
            }
          }
        }
      } catch {
        // silent
      }
    })();
  }, []);

  function handleSetStatus(s: StatusOption) {
    setStatus(s);
    window.localStorage.setItem(STATUS_KEY, s);
  }

  useEffect(() => {
    if (scroll.y > lastScrollYRef.current) {
      setShowFAB(true);
    } else if (scroll.y < lastScrollYRef.current) {
      setShowFAB(false);
    }
    lastScrollYRef.current = scroll.y;
  }, [scroll.y]);

  useEffect(() => {
    const stored = window.localStorage.getItem(LIKED_POSTS_STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as string[];
      if (Array.isArray(parsed)) {
        setLikedPostIds(parsed);
      }
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LIKED_POSTS_STORAGE_KEY, JSON.stringify(likedPostIds));
  }, [likedPostIds]);

  async function loadPosts(reset = false) {
    const offset = reset ? 0 : postOffset;
    const setLoading = reset ? setIsLoadingPosts : setIsLoadingMore;

    setLoading(true);

    try {
      const response = await fetch(`/api/posts?limit=${POSTS_PAGE_SIZE}&offset=${offset}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = (await response.json()) as {
        items: PostItem[];
        pagination: { hasMore: boolean; nextOffset: number | null };
      };

      const items = data.items ?? [];
      setHasMorePosts(Boolean(data.pagination?.hasMore));
      setPostOffset(data.pagination?.nextOffset ?? offset + items.length);

      if (reset) {
        setPosts(sortPosts(items));
      } else {
        setPosts((prev) => sortPosts([...prev, ...items]));
      }
    } catch {
      notifications.show({
        color: 'red',
        title: 'Ralat',
        message: 'Tidak dapat memuat senarai post.',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isGuestReady) return;
    void loadPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGuestReady]);

  async function handleToggleLike(post: PostItem) {
    const isLiked = likedPostIds.includes(post.id);

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isLiked ? 'unlike' : 'like' }),
      });

      const data = (await response.json()) as { likes?: number };

      if (!response.ok || typeof data.likes !== 'number') {
        throw new Error('Unable to toggle like');
      }

      setPosts((prev) =>
        prev.map((item) => (item.id === post.id ? { ...item, likes: Number(data.likes) } : item))
      );

      setLikedPostIds((prev) => {
        if (isLiked) {
          return prev.filter((id) => id !== post.id);
        }

        return [...prev, post.id];
      });
    } catch {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat kemas kini like.' });
    }
  }

  async function handleToggleRepost(post: PostItem) {
    const isReposted = repostedPostIds.includes(post.id);
    const action = isReposted ? 'unrepost' : 'repost';

    try {
      const response = await fetch(`/api/posts/${post.id}/repost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = (await response.json()) as { reposts?: number };

      if (!response.ok || typeof data.reposts !== 'number') {
        throw new Error('Unable to repost');
      }

      setPosts((prev) =>
        prev.map((item) => (item.id === post.id ? { ...item, reposts: Number(data.reposts) } : item))
      );

      setRepostedPostIds((prev) => {
        if (isReposted) {
          return prev.filter((id) => id !== post.id);
        }
        return [...prev, post.id];
      });
      
      // silent — no notification for repost
    } catch {
      notifications.show({ color: 'red', message: 'Tidak dapat mengemas kini repost.' });
    }
  }

  async function handleTogglePin(post: PostItem) {
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !post.isPinned }),
      });

      if (!response.ok) {
        throw new Error('Unable to toggle pin');
      }

      setPosts((prev) =>
        sortPosts(prev.map((item) => (item.id === post.id ? { ...item, isPinned: !item.isPinned } : item)))
      );
    } catch {
      notifications.show({ color: 'red', message: 'Tidak dapat kemas kini pin post.' });
    }
  }

  async function handleDeletePost(postId: string) {
    if (!authorToken) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorToken }),
      });

      if (!response.ok) {
        throw new Error('Unable to delete post');
      }

      setPosts((prev) => prev.filter((item) => item.id !== postId));
      notifications.show({ color: 'green', message: 'Post berjaya dipadam.' });
    } catch {
      notifications.show({ color: 'red', message: 'Tidak dapat padam post.' });
    }
  }

  async function handleToggleComments(postId: string) {
    const isExpanded = Boolean(expandedPostIds[postId]);

    if (isExpanded) {
      setExpandedPostIds((prev) => ({ ...prev, [postId]: false }));
      return;
    }

    setExpandedPostIds((prev) => ({ ...prev, [postId]: true }));

    if (commentsByPost[postId]) {
      return;
    }

    setLoadingCommentsByPost((prev) => ({ ...prev, [postId]: true }));

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, { cache: 'no-store' });
      const data = (await response.json()) as { items?: CommentItem[] };

      if (!response.ok) {
        throw new Error('Unable to load comments');
      }

      setCommentsByPost((prev) => ({ ...prev, [postId]: data.items ?? [] }));
    } catch {
      notifications.show({ color: 'red', message: 'Tidak dapat memuat komen.' });
    } finally {
      setLoadingCommentsByPost((prev) => ({ ...prev, [postId]: false }));
    }
  }

  async function handleCreateComment(postId: string) {
    const content = (commentDrafts[postId] ?? '').trim();

    if (!content || !authorToken) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          authorName: guestName || 'Tetamu',
          authorToken,
        }),
      });

      const data = (await response.json()) as { item?: CommentItem; error?: string };
      if (!response.ok || !data.item) {
        throw new Error(data.error ?? 'Unable to add comment');
      }

      setCommentsByPost((prev) => {
        const existing = prev[postId] ?? [];
        return { ...prev, [postId]: [...existing, data.item as CommentItem] };
      });

      setPosts((prev) =>
        prev.map((item) =>
          item.id === postId ? { ...item, commentsCount: item.commentsCount + 1 } : item
        )
      );

      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    } catch {
      notifications.show({ color: 'red', message: 'Tidak dapat tambah komen.' });
    }
  }

  async function handleDeleteComment(postId: string, commentId: string) {
    if (!authorToken) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorToken }),
      });

      if (!response.ok) {
        throw new Error('Unable to delete comment');
      }

      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] ?? []).filter((item) => item.id !== commentId),
      }));

      setPosts((prev) =>
        prev.map((item) =>
          item.id === postId ? { ...item, commentsCount: Math.max(item.commentsCount - 1, 0) } : item
        )
      );
    } catch {
      notifications.show({ color: 'red', message: 'Tidak dapat padam komen.' });
    }
  }

  const postCountLabel = useMemo(() => {
    if (posts.length === 0) {
      return 'Tiada post setakat ini';
    }

    return `${posts.length} post dipaparkan`;
  }, [posts.length]);

  return (
    <Container px={0} py={0}>
      {/* ── Compact Sticky Header ── */}
      <Box
        pos="sticky"
        top={0}
        bg="#181818"
        style={{ zIndex: 100, borderBottom: '1px solid var(--mantine-color-default-border)' }}
        px="md"
        py={6}
      >
        <Group align="center" justify="space-between" wrap="nowrap" style={{ minHeight: 28 }}>
          {/* Left: status indicator */}
          {isAdmin ? (
            <Menu shadow="md" width={150} position="bottom-start">
              <Menu.Target>
                <Box
                  style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
                >
                  <Box
                    style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: STATUS_COLORS[status],
                      boxShadow: `0 0 6px ${STATUS_COLORS[status]}`,
                    }}
                  />
                  <Text size="xs" c="dimmed">Online</Text>
                </Box>
              </Menu.Target>
              <Menu.Dropdown>
                {(['online', 'busy', 'offline'] as StatusOption[]).map((s) => (
                  <Menu.Item
                    key={s}
                    fw={status === s ? 700 : 400}
                    leftSection={
                      <Box style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[s] }} />
                    }
                    onClick={() => handleSetStatus(s)}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Box style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Box
                style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: STATUS_COLORS[status],
                  boxShadow: `0 0 6px ${STATUS_COLORS[status]}`,
                }}
              />
              <Text size="xs" c="dimmed">Online</Text>
            </Box>
          )}

          {/* Center: title */}
          <Text fw={800} size="md" style={{ letterSpacing: '1px' }}>
            LULUS SPP
          </Text>

          {/* Right: icons */}
          <Group gap={4}>
            <ActionIcon
              component={Link}
              href="/notifications"
              variant="subtle"
              color="gray"
              size="md"
              aria-label="Notifikasi"
            >
              <IconBell size={18} />
            </ActionIcon>
            <ActionIcon
              component={Link}
              href="/search"
              variant="subtle"
              color="gray"
              size="md"
              aria-label="Search"
            >
              <IconSearch size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </Box>

      <Stack gap={0}>
        {/* ── Admin Sticky Banner ── */}
        {isBannerVisible && banner && (
          <Box px="md" pt="sm">
            <Paper
              p="sm"
              radius="md"
              style={{
                background:
                  'linear-gradient(115deg, rgba(38,46,92,0.98) 0%, rgba(31,41,78,0.96) 45%, rgba(23,28,56,0.96) 100%)',
                border: '1px solid rgba(113,131,255,0.35)',
                boxShadow: '0 8px 20px rgba(8,10,22,0.35)',
              }}
            >
              <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
                <Group gap={8} align="center" wrap="nowrap">
                  <Badge
                    size="xs"
                    variant="filled"
                    color="indigo"
                    style={{ letterSpacing: 0.3, textTransform: 'uppercase' }}
                  >
                    Pengumuman
                  </Badge>
                  <Text size="xs" c="indigo.1">
                    Admin
                  </Text>
                </Group>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  aria-label="Tutup banner"
                  onClick={() => {
                    setIsBannerVisible(false);
                    window.localStorage.setItem(DISMISSED_BANNER_KEY, banner.id);
                  }}
                  style={{ color: '#c8d0ff', flexShrink: 0 }}
                >
                  <IconX size={14} />
                </ActionIcon>
              </Group>

              <Text
                size="sm"
                mt={8}
                style={{
                  color: '#edf1ff',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                }}
              >
                {banner.content}
              </Text>
            </Paper>
          </Box>
        )}
        {isLoadingPosts ? (
          <Stack gap={0}>
            {[...Array(5)].map((_, i) => (
              <Box key={i} p="md" bg="#181818">
                <Group wrap="nowrap" align="flex-start" gap="sm">
                  <Skeleton height={40} width={40} circle />
                  <Stack gap="sm" style={{ flex: 1 }}>
                    <Skeleton height={14} width="40%" />
                    <Skeleton height={14} width="90%" mt={4} />
                    <Skeleton height={14} width="60%" mt={4} />
                  </Stack>
                </Group>
                <Divider mt="md" />
              </Box>
            ))}
          </Stack>
        ) : posts.length === 0 ? (
          <EmptyState
            title="Belum ada post"
            description="Jadi yang pertama berkongsi pengalaman atau tips SPP anda."
          />
        ) : (
          <Stack gap={0}>
            {posts.map((post) => {
              const isOwner = Boolean(authorToken && authorToken === post.authorToken);
              const canDelete = isOwner || isAdmin;
              const isLiked = likedPostIds.includes(post.id);
              const isExpanded = Boolean(expandedPostIds[post.id]);
              const comments = commentsByPost[post.id] ?? [];

              return (
                <Box key={post.id}>
                  <Box p="md" bg="#181818">
                    <Group wrap="nowrap" align="flex-start" gap="sm">
                      <ActionIcon variant="transparent" size={40} radius="xl">
                        <IconUserCircle size={40} stroke={1.5} color="var(--mantine-color-dimmed)" />
                      </ActionIcon>
                      <Stack gap={0} style={{ flex: 1 }}>
                        <Group justify="space-between" align="flex-start" wrap="nowrap">
                          <Group gap={6} align="baseline">
                            <Text
                              fw={600}
                              size="sm"
                              lh={1.2}
                              style={post.authorToken === 'admin' || post.authorToken === 'admin-post' ? { color: '#262e5c' } : undefined}
                            >
                              {post.authorName}
                            </Text>
                            <Text size="xs" c="dimmed" lh={1.2}>
                              {formatRelativeTime(post.createdAt)}
                            </Text>
                            {post.isPinned && (
                              <Badge color="yellow" variant="light" leftSection={<IconPin size={12} />}>
                                Pinned
                              </Badge>
                            )}
                          </Group>

                        <Menu position="bottom-end" withinPortal>
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray" aria-label="Settings">
                              <IconDots size={18} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item 
                              leftSection={<IconLink size={14} />} 
                              onClick={() => {
                                navigator.clipboard.writeText(window.location.origin);
                                notifications.show({ message: 'Pautan disalin.', color: 'green' });
                              }}
                            >
                              Salin Pautan
                            </Menu.Item>
                            <Menu.Item leftSection={<IconBookmark size={14} />}>
                              Simpan (Akan datang)
                            </Menu.Item>

                            {isAdmin && (
                              <Menu.Item
                                color={post.isPinned ? 'yellow' : 'gray'}
                                leftSection={<IconPin size={14} />}
                                onClick={() => void handleTogglePin(post)}
                              >
                                {post.isPinned ? 'Unpin Post' : 'Pin Post'}
                              </Menu.Item>
                            )}

                            {canDelete && (
                              <>
                                <Menu.Divider />
                                <Menu.Item
                                  color="red"
                                  leftSection={<IconTrash size={14} />}
                                  onClick={() => void handleDeletePost(post.id)}
                                >
                                  Padam Post
                                </Menu.Item>
                              </>
                            )}
                          </Menu.Dropdown>
                        </Menu>
                      </Group>

                      <Text size="sm" mt={-4} style={{ whiteSpace: 'pre-wrap' }}>
                        {post.content}
                      </Text>

                      {post.sourceLink && (() => {
                        const raw = post.sourceLink.trim();
                        const href = resolveCreditHref(raw);
                        const label = resolveCreditLabel(post.sourceLink);
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

                      <Group gap="md">
                        <Button
                          size="xs"
                          variant="transparent"
                          color={isLiked ? 'red' : 'gray'}
                          px={0}
                          leftSection={<IconHeart size={20} fill={isLiked ? 'red' : 'transparent'} />}
                          onClick={() => void handleToggleLike(post)}
                        >
                          {post.likes}
                        </Button>

                        <Button
                          size="xs"
                          variant="transparent"
                          color="gray"
                          px={0}
                          leftSection={<IconMessageCircle size={20} />}
                          onClick={() => void handleToggleComments(post.id)}
                        >
                          {post.commentsCount}
                        </Button>

                        <Button
                          size="xs"
                          variant="transparent"
                          color={repostedPostIds.includes(post.id) ? 'green' : 'gray'}
                          px={0}
                          leftSection={
                            <IconRepeat
                              size={20}
                              style={repostedPostIds.includes(post.id) ? { color: '#22c55e' } : undefined}
                            />
                          }
                          onClick={() => void handleToggleRepost(post)}
                        >
                          {post.reposts || 0}
                        </Button>
                      </Group>

                      {isExpanded && (
                        <Stack gap="xs" pt={6}>
                          {loadingCommentsByPost[post.id] ? (
                            <Stack gap={6} py={8}>
                              <Skeleton height={10} width="88%" />
                              <Skeleton height={10} width="74%" />
                            </Stack>
                          ) : comments.length === 0 ? (
                            <Text size="xs" c="dimmed">
                              Belum ada komen.
                            </Text>
                          ) : (
                            comments.map((comment) => {
                              const canDeleteComment = isAdmin || comment.authorToken === authorToken;

                              return (
                                <Box key={comment.id} p="xs" bg="var(--mantine-color-default-hover)" style={{ borderRadius: '4px' }}>
                                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                                    <Group wrap="nowrap" align="flex-start" gap="xs">
                                      <Avatar color="blue" radius="xl" size="sm">
                                        {comment.authorName.charAt(0).toUpperCase() || 'T'}
                                      </Avatar>
                                      <div>
                                        <Group gap={6} align="center">
                                          <Text size="sm" fw={600}>
                                            {comment.authorName}
                                          </Text>
                                          <Text size="xs" c="dimmed">
                                            {formatRelativeTime(comment.createdAt)}
                                          </Text>
                                        </Group>
                                        <Text size="sm" mt={2}>
                                          {comment.content}
                                        </Text>
                                      </div>
                                    </Group>

                                    {canDeleteComment && (
                                      <ActionIcon
                                        size="sm"
                                        variant="subtle"
                                        color="red"
                                        onClick={() => void handleDeleteComment(post.id, comment.id)}
                                        aria-label="Delete comment"
                                      >
                                        <IconTrash size={14} />
                                      </ActionIcon>
                                    )}
                                  </Group>
                                </Box>
                              );
                            })
                          )}

                          <Textarea
                            minRows={2}
                            autosize
                            value={commentDrafts[post.id] ?? ''}
                            onChange={(event) =>
                              setCommentDrafts((prev) => ({ ...prev, [post.id]: event.currentTarget.value }))
                            }
                            placeholder="Tulis komen anda..."
                          />

                          <Group justify="flex-end">
                            <Button size="xs" onClick={() => void handleCreateComment(post.id)}>
                              Hantar komen
                            </Button>
                          </Group>
                        </Stack>
                      )}
                    </Stack>
                    </Group>
                  </Box>
                  <Divider />
                </Box>
              );
            })}

            {hasMorePosts && (
              <Group justify="center" pt="xs">
                <Button variant="default" onClick={() => void loadPosts(false)} loading={isLoadingMore}>
                  Load More
                </Button>
              </Group>
            )}
          </Stack>
        )}
      </Stack>

      {showFAB && (
        <FAB
          label="Buat post baharu"
          icon={<IconMessagePlus size={24} />}
          onClick={() => router.push('/buat-post')}
        />
      )}

    </Container>
  );
}
