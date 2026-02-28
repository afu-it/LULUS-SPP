'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionIcon,
  Anchor,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Group,
  Menu,
  Skeleton,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconBookmark,
  IconChevronDown,
  IconDots,
  IconHeart,
  IconLink,
  IconMessageCircle,
  IconPin,
  IconRepeat,
  IconTrash,
  IconUserCircle,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useParams, useRouter } from 'next/navigation';
import { EmptyState } from '@/components/common/EmptyState';
import { formatRelativeTime } from '@/lib/date';
import { useAuth } from '@/hooks/useAuth';
import { useGuestName } from '@/hooks/useGuestName';
import type { CommentItem, PostItem } from '@/types/entities';

const LIKED_POSTS_STORAGE_KEY = 'lulus-spp:liked-posts';
const REPOSTED_POSTS_STORAGE_KEY = 'lulus-spp:reposted-posts';
const LIKED_COMMENTS_STORAGE_KEY = 'lulus-spp:liked-comments';
const REPOSTED_COMMENTS_STORAGE_KEY = 'lulus-spp:reposted-comments';

interface PostDetailResponse {
  item?: PostItem;
  comments?: CommentItem[];
  error?: string;
}

type CommentSortOption = 'top' | 'recent';

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

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const postId = typeof params.id === 'string' ? params.id : '';
  const { isAdmin } = useAuth();
  const { guestName, authorToken, isReady: isGuestReady } = useGuestName();

  const [post, setPost] = useState<PostItem | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [repostedPostIds, setRepostedPostIds] = useState<string[]>([]);
  const [likedCommentIds, setLikedCommentIds] = useState<string[]>([]);
  const [repostedCommentIds, setRepostedCommentIds] = useState<string[]>([]);
  const [commentSort, setCommentSort] = useState<CommentSortOption>('top');
  const [isComposerVisible, setIsComposerVisible] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(LIKED_POSTS_STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as string[];
      if (Array.isArray(parsed)) setLikedPostIds(parsed);
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LIKED_POSTS_STORAGE_KEY, JSON.stringify(likedPostIds));
  }, [likedPostIds]);

  useEffect(() => {
    const stored = window.localStorage.getItem(REPOSTED_POSTS_STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as string[];
      if (Array.isArray(parsed)) setRepostedPostIds(parsed);
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(REPOSTED_POSTS_STORAGE_KEY, JSON.stringify(repostedPostIds));
  }, [repostedPostIds]);

  useEffect(() => {
    const stored = window.localStorage.getItem(LIKED_COMMENTS_STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as string[];
      if (Array.isArray(parsed)) setLikedCommentIds(parsed);
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LIKED_COMMENTS_STORAGE_KEY, JSON.stringify(likedCommentIds));
  }, [likedCommentIds]);

  useEffect(() => {
    const stored = window.localStorage.getItem(REPOSTED_COMMENTS_STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as string[];
      if (Array.isArray(parsed)) setRepostedCommentIds(parsed);
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(REPOSTED_COMMENTS_STORAGE_KEY, JSON.stringify(repostedCommentIds));
  }, [repostedCommentIds]);

  useEffect(() => {
    if (!postId || !isGuestReady) return;

    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setCommentDraft('');
      setCommentSort('top');
      setIsComposerVisible(false);

      try {
        const response = await fetch(`/api/posts/${postId}`, { cache: 'no-store' });
        const data = (await response.json()) as PostDetailResponse;

        if (cancelled) return;

        if (!response.ok || !data.item) {
          setPost(null);
          setComments([]);
          if (response.status !== 404) {
            notifications.show({ color: 'red', message: 'Tidak dapat memuat post.' });
          }
          return;
        }

        setPost(data.item);
        setComments(data.comments ?? []);
      } catch {
        if (cancelled) return;
        setPost(null);
        setComments([]);
        notifications.show({ color: 'red', message: 'Tidak dapat memuat post.' });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [postId, isGuestReady]);

  async function handleTogglePostLike() {
    if (!post) return;

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

      setPost((prev) => (prev ? { ...prev, likes: Number(data.likes) } : prev));
      setLikedPostIds((prev) => {
        if (isLiked) return prev.filter((id) => id !== post.id);
        return [...prev, post.id];
      });
    } catch {
      notifications.show({ color: 'red', message: 'Tidak dapat kemas kini like.' });
    }
  }

  async function handleTogglePostRepost() {
    if (!post) return;

    const isReposted = repostedPostIds.includes(post.id);

    try {
      const response = await fetch(`/api/posts/${post.id}/repost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isReposted ? 'unrepost' : 'repost' }),
      });

      const data = (await response.json()) as { reposts?: number };
      if (!response.ok || typeof data.reposts !== 'number') {
        throw new Error('Unable to toggle repost');
      }

      setPost((prev) => (prev ? { ...prev, reposts: Number(data.reposts) } : prev));
      setRepostedPostIds((prev) => {
        if (isReposted) return prev.filter((id) => id !== post.id);
        return [...prev, post.id];
      });
    } catch {
      notifications.show({ color: 'red', message: 'Tidak dapat kemas kini repost.' });
    }
  }

  async function handleTogglePostPin() {
    if (!post) return;

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !post.isPinned }),
      });

      if (!response.ok) throw new Error('Unable to toggle pin');
      setPost((prev) => (prev ? { ...prev, isPinned: !prev.isPinned } : prev));
    } catch {
      notifications.show({ color: 'red', message: 'Tidak dapat kemas kini pin post.' });
    }
  }

  async function handleDeletePost() {
    if (!post || !authorToken) return;

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorToken }),
      });

      if (!response.ok) throw new Error('Unable to delete post');

      notifications.show({ color: 'green', message: 'Post berjaya dipadam.' });
      router.push('/');
    } catch {
      notifications.show({ color: 'red', message: 'Tidak dapat padam post.' });
    }
  }

  async function handleCreateComment() {
    if (!post || !authorToken) return;

    const content = commentDraft.trim();
    if (!content) return;

    setIsSubmittingComment(true);

    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
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

      setComments((prev) => [...prev, data.item as CommentItem]);
      setPost((prev) => (prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : prev));
      setCommentDraft('');
    } catch {
      notifications.show({ color: 'red', message: 'Tidak dapat tambah komen.' });
    } finally {
      setIsSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!post || !authorToken) return;

    try {
      const response = await fetch(`/api/posts/${post.id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorToken }),
      });

      if (!response.ok) throw new Error('Unable to delete comment');

      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      setPost((prev) =>
        prev ? { ...prev, commentsCount: Math.max(prev.commentsCount - 1, 0) } : prev
      );
    } catch {
      notifications.show({ color: 'red', message: 'Tidak dapat padam komen.' });
    }
  }

  function handleFocusCommentComposer() {
    setIsComposerVisible(true);
    window.requestAnimationFrame(() => {
      commentInputRef.current?.focus();
      commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function handleToggleCommentLike(commentId: string) {
    setLikedCommentIds((prev) =>
      prev.includes(commentId) ? prev.filter((id) => id !== commentId) : [...prev, commentId]
    );
  }

  function handleToggleCommentRepost(commentId: string) {
    setRepostedCommentIds((prev) =>
      prev.includes(commentId) ? prev.filter((id) => id !== commentId) : [...prev, commentId]
    );
  }

  const sortedComments = useMemo(() => {
    const items = [...comments];
    if (commentSort === 'recent') {
      return items.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return items.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [comments, commentSort]);

  const isPostLiked = Boolean(post && likedPostIds.includes(post.id));
  const isPostReposted = Boolean(post && repostedPostIds.includes(post.id));
  const canDeletePost = Boolean(post && (isAdmin || post.authorToken === authorToken));

  return (
    <Container px={0} py={0}>
      <Box
        pos="sticky"
        top={0}
        bg="#181818"
        style={{ zIndex: 100, borderBottom: '1px solid var(--mantine-color-default-border)' }}
        px="md"
        py={6}
      >
        <Group justify="space-between" align="center" wrap="nowrap" style={{ minHeight: 28 }}>
          <ActionIcon variant="subtle" color="gray" aria-label="Kembali" onClick={() => router.push('/')}>
            <IconArrowLeft size={18} />
          </ActionIcon>
          <Text fw={800} size="md" style={{ letterSpacing: '1px' }}>
            POST
          </Text>
          <Box w={30} />
        </Group>
      </Box>

      {isLoading ? (
        <Stack gap={0}>
          <Box p="md" bg="#181818">
            <Group wrap="nowrap" align="flex-start" gap="sm">
              <Skeleton height={40} width={40} circle />
              <Stack gap="sm" style={{ flex: 1 }}>
                <Skeleton height={14} width="35%" />
                <Skeleton height={14} width="88%" mt={4} />
                <Skeleton height={14} width="64%" mt={4} />
              </Stack>
            </Group>
          </Box>
          <Divider />
          {[...Array(3)].map((_, index) => (
            <Box key={index}>
              <Box p="md" bg="#181818">
                <Group wrap="nowrap" align="flex-start" gap="sm">
                  <Skeleton height={40} width={40} circle />
                  <Stack gap="sm" style={{ flex: 1 }}>
                    <Skeleton height={12} width="30%" />
                    <Skeleton height={12} width="90%" />
                    <Skeleton height={12} width="70%" />
                  </Stack>
                </Group>
              </Box>
              <Divider />
            </Box>
          ))}
        </Stack>
      ) : !post ? (
        <EmptyState title="Post tidak dijumpai" description="Post mungkin sudah dipadam." />
      ) : (
        <Stack gap={0}>
          <Box p="md" bg="#181818">
            <Group justify="space-between" align="center" wrap="nowrap">
              <Group gap="sm" align="center">
                <ActionIcon variant="transparent" size={40} radius="xl">
                  <IconUserCircle size={40} stroke={1.5} color="var(--mantine-color-dimmed)" />
                </ActionIcon>
                <Group gap={6} align="center">
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
                      navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
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
                      onClick={() => void handleTogglePostPin()}
                    >
                      {post.isPinned ? 'Unpin Post' : 'Pin Post'}
                    </Menu.Item>
                  )}

                  {canDeletePost && (
                    <>
                      <Menu.Divider />
                      <Menu.Item
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => void handleDeletePost()}
                      >
                        Padam Post
                      </Menu.Item>
                    </>
                  )}
                </Menu.Dropdown>
              </Menu>
            </Group>

            <Text size="sm" mt={8} style={{ whiteSpace: 'pre-wrap' }}>
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
                        <Text span c="#F3F5F7">
                          {raw}
                        </Text>
                      )}
                    </Text>
                  </Box>
                </>
              );
            })()}

            <Group gap="md" mt={8}>
              <Button
                size="xs"
                variant="transparent"
                color={isPostLiked ? 'red' : 'gray'}
                px={0}
                leftSection={<IconHeart size={20} fill={isPostLiked ? 'red' : 'transparent'} />}
                onClick={() => void handleTogglePostLike()}
              >
                {post.likes}
              </Button>

              <Button
                size="xs"
                variant="transparent"
                color="gray"
                px={0}
                leftSection={<IconMessageCircle size={20} />}
                onClick={handleFocusCommentComposer}
              >
                {post.commentsCount}
              </Button>

              <Button
                size="xs"
                variant="transparent"
                color={isPostReposted ? 'green' : 'gray'}
                px={0}
                leftSection={
                  <IconRepeat
                    size={20}
                    style={isPostReposted ? { color: '#22c55e' } : undefined}
                  />
                }
                onClick={() => void handleTogglePostRepost()}
              >
                {post.reposts || 0}
              </Button>
            </Group>
          </Box>
          <Box bg="#181818">
            <Divider />
            <Group px="md" py={10} justify="flex-start">
              <Menu position="bottom-start" withinPortal>
                <Menu.Target>
                  <Button
                    size="xs"
                    variant="subtle"
                    color="gray"
                    rightSection={<IconChevronDown size={14} />}
                  >
                    {commentSort === 'top' ? 'Top' : 'Recent'}
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item onClick={() => setCommentSort('top')}>Top</Menu.Item>
                  <Menu.Item onClick={() => setCommentSort('recent')}>Recent</Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
            <Divider />
          </Box>

          {sortedComments.length === 0 ? (
            <Box p="md" bg="#181818">
              <Text size="sm" c="dimmed">
                Belum ada komen.
              </Text>
            </Box>
          ) : (
            sortedComments.map((comment) => {
              const canDeleteComment = isAdmin || comment.authorToken === authorToken;
              const isCommentLiked = likedCommentIds.includes(comment.id);
              const isCommentReposted = repostedCommentIds.includes(comment.id);

              return (
                <Box key={comment.id} id={`comment-${comment.id}`}>
                  <Box p="md" bg="#181818">
                    <Group wrap="nowrap" align="flex-start" gap="sm">
                      <ActionIcon variant="transparent" size={40} radius="xl">
                        <IconUserCircle size={40} stroke={1.5} color="var(--mantine-color-dimmed)" />
                      </ActionIcon>

                      <Stack gap={0} style={{ flex: 1 }}>
                        <Group justify="space-between" align="flex-start" wrap="nowrap">
                          <Group gap={6} align="baseline">
                            <Text fw={600} size="sm" lh={1.2}>
                              {comment.authorName}
                            </Text>
                            <Text size="xs" c="dimmed" lh={1.2}>
                              {formatRelativeTime(comment.createdAt)}
                            </Text>
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
                                  navigator.clipboard.writeText(
                                    `${window.location.origin}/posts/${post.id}#comment-${comment.id}`
                                  );
                                  notifications.show({ message: 'Pautan disalin.', color: 'green' });
                                }}
                              >
                                Salin Pautan
                              </Menu.Item>

                              {canDeleteComment && (
                                <>
                                  <Menu.Divider />
                                  <Menu.Item
                                    color="red"
                                    leftSection={<IconTrash size={14} />}
                                    onClick={() => void handleDeleteComment(comment.id)}
                                  >
                                    Padam Komen
                                  </Menu.Item>
                                </>
                              )}
                            </Menu.Dropdown>
                          </Menu>
                        </Group>

                        <Text size="sm" mt={-4} style={{ whiteSpace: 'pre-wrap' }}>
                          {comment.content}
                        </Text>

                        <Group gap="md">
                          <Button
                            size="xs"
                            variant="transparent"
                            color={isCommentLiked ? 'red' : 'gray'}
                            px={0}
                            leftSection={<IconHeart size={20} fill={isCommentLiked ? 'red' : 'transparent'} />}
                            onClick={() => handleToggleCommentLike(comment.id)}
                          >
                            {isCommentLiked ? 1 : 0}
                          </Button>

                          <Button
                            size="xs"
                            variant="transparent"
                            color="gray"
                            px={0}
                            leftSection={<IconMessageCircle size={20} />}
                            onClick={handleFocusCommentComposer}
                          >
                            0
                          </Button>

                          <Button
                            size="xs"
                            variant="transparent"
                            color={isCommentReposted ? 'green' : 'gray'}
                            px={0}
                            leftSection={
                              <IconRepeat
                                size={20}
                                style={isCommentReposted ? { color: '#22c55e' } : undefined}
                              />
                            }
                            onClick={() => handleToggleCommentRepost(comment.id)}
                          >
                            {isCommentReposted ? 1 : 0}
                          </Button>
                        </Group>
                      </Stack>
                    </Group>
                  </Box>
                  <Divider />
                </Box>
              );
            })
          )}

          {isComposerVisible && (
            <Box p="md" bg="#181818">
              <Stack gap="xs">
                <Textarea
                  ref={commentInputRef}
                  minRows={2}
                  autosize
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.currentTarget.value)}
                  placeholder="Tulis komen anda..."
                />
                <Group justify="flex-end">
                  <Button size="xs" onClick={() => void handleCreateComment()} loading={isSubmittingComment}>
                    Hantar komen
                  </Button>
                </Group>
              </Stack>
            </Box>
          )}
        </Stack>
      )}
    </Container>
  );
}
