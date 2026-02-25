'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { IconMessageCircle, IconMessagePlus, IconPin, IconThumbUp, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { EmptyState } from '@/components/common/EmptyState';
import { FAB } from '@/components/common/FAB';
import { formatDateTime } from '@/lib/date';
import { useAuth } from '@/hooks/useAuth';
import { useGuestName } from '@/hooks/useGuestName';
import type { AnnouncementItem, CommentItem, PostItem } from '@/types/entities';

const POSTS_PAGE_SIZE = 10;
const LIKED_POSTS_STORAGE_KEY = 'lulus-spp:liked-posts';

function sortPosts(items: PostItem[]) {
  return [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export default function HomePage() {
  const { isAdmin } = useAuth();
  const { guestName, authorToken, isReady: isGuestReady } = useGuestName();

  const [announcement, setAnnouncement] = useState<AnnouncementItem | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommentItem[]>>({});
  const [expandedPostIds, setExpandedPostIds] = useState<Record<string, boolean>>({});
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);

  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingAnnouncement, setIsLoadingAnnouncement] = useState(true);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [isSubmittingAnnouncement, setIsSubmittingAnnouncement] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [postOffset, setPostOffset] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(false);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  const [newPostContent, setNewPostContent] = useState('');
  const [announcementDraft, setAnnouncementDraft] = useState('');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [loadingCommentsByPost, setLoadingCommentsByPost] = useState<Record<string, boolean>>({});

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

  async function loadAnnouncement() {
    setIsLoadingAnnouncement(true);

    try {
      const response = await fetch('/api/announcements', { cache: 'no-store' });
      const data = (await response.json()) as { item: AnnouncementItem | null };
      setAnnouncement(data.item ?? null);
      setAnnouncementDraft(data.item?.content ?? '');
    } catch {
      notifications.show({
        color: 'red',
        title: 'Ralat',
        message: 'Tidak dapat memuat pengumuman.',
      });
    } finally {
      setIsLoadingAnnouncement(false);
    }
  }

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
    void loadAnnouncement();
    void loadPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreatePost() {
    const content = newPostContent.trim();

    if (!content) {
      return;
    }

    if (!authorToken) {
      notifications.show({
        color: 'red',
        title: 'Ralat',
        message: 'Author token belum tersedia. Cuba lagi sebentar.',
      });
      return;
    }

    setIsSubmittingPost(true);

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          authorName: guestName || 'Tetamu',
          authorToken,
        }),
      });

      const data = (await response.json()) as { item?: PostItem; error?: string };

      if (!response.ok || !data.item) {
        throw new Error(data.error ?? 'Unable to create post');
      }

      setPosts((prev) => sortPosts([data.item as PostItem, ...prev]));
      setNewPostContent('');
      setIsPostModalOpen(false);
      notifications.show({ color: 'green', title: 'Berjaya', message: 'Post berjaya dibuat.' });
    } catch {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat membuat post.' });
    } finally {
      setIsSubmittingPost(false);
    }
  }

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
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat kemas kini pin post.' });
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
      notifications.show({ color: 'green', title: 'Berjaya', message: 'Post berjaya dipadam.' });
    } catch {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat padam post.' });
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
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat memuat komen.' });
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
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat tambah komen.' });
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
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat padam komen.' });
    }
  }

  async function handleSaveAnnouncement() {
    const content = announcementDraft.trim();

    if (!content) {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Isi pengumuman diperlukan.' });
      return;
    }

    setIsSubmittingAnnouncement(true);

    try {
      const isEditing = Boolean(announcement?.id);
      const response = await fetch(
        isEditing ? `/api/announcements/${announcement?.id}` : '/api/announcements',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, isActive: true }),
        }
      );

      if (!response.ok) {
        throw new Error('Unable to save announcement');
      }

      await loadAnnouncement();
      setIsAnnouncementModalOpen(false);
      notifications.show({ color: 'green', title: 'Berjaya', message: 'Pengumuman dikemas kini.' });
    } catch {
      notifications.show({ color: 'red', title: 'Ralat', message: 'Tidak dapat simpan pengumuman.' });
    } finally {
      setIsSubmittingAnnouncement(false);
    }
  }

  const postCountLabel = useMemo(() => {
    if (posts.length === 0) {
      return 'Tiada post setakat ini';
    }

    return `${posts.length} post dipaparkan`;
  }, [posts.length]);

  return (
    <Container py="md">
      <Stack gap="md">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={2}>HOME</Title>
            <Text size="sm" c="dimmed">
              {postCountLabel}
            </Text>
          </div>
          {isAdmin && (
            <Button size="xs" variant="light" onClick={() => setIsAnnouncementModalOpen(true)}>
              Edit Pengumuman
            </Button>
          )}
        </Group>

        {!isLoadingAnnouncement && announcement && (
          <Paper withBorder p="md" radius="md" style={{ position: 'sticky', top: 8, zIndex: 10 }}>
            <Stack gap={4}>
              <Group justify="space-between">
                <Badge color="brand" variant="filled">
                  Pengumuman
                </Badge>
                <Text size="xs" c="dimmed">
                  {formatDateTime(announcement.updatedAt)}
                </Text>
              </Group>
              <Text size="sm">{announcement.content}</Text>
            </Stack>
          </Paper>
        )}

        {isLoadingAnnouncement && (
          <Group justify="center">
            <Loader size="sm" />
          </Group>
        )}

        {isLoadingPosts ? (
          <Group justify="center" py="lg">
            <Loader />
          </Group>
        ) : posts.length === 0 ? (
          <EmptyState
            title="Belum ada post"
            description="Jadi yang pertama berkongsi pengalaman atau tips SPP anda."
          />
        ) : (
          <Stack gap="sm">
            {posts.map((post) => {
              const isOwner = Boolean(authorToken && authorToken === post.authorToken);
              const canDelete = isOwner || isAdmin;
              const isLiked = likedPostIds.includes(post.id);
              const isExpanded = Boolean(expandedPostIds[post.id]);
              const comments = commentsByPost[post.id] ?? [];

              return (
                <Paper key={post.id} withBorder p="md" radius="md">
                  <Stack gap="sm">
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <Stack gap={2}>
                        <Group gap={6}>
                          <Text fw={600} size="sm">
                            {post.authorName}
                          </Text>
                          {post.isPinned && (
                            <Badge color="yellow" variant="light" leftSection={<IconPin size={12} />}>
                              Pinned
                            </Badge>
                          )}
                        </Group>
                        <Text size="xs" c="dimmed">
                          {formatDateTime(post.createdAt)}
                        </Text>
                      </Stack>

                      <Group gap={4}>
                        {isAdmin && (
                          <ActionIcon
                            variant={post.isPinned ? 'filled' : 'light'}
                            color={post.isPinned ? 'yellow' : 'gray'}
                            onClick={() => void handleTogglePin(post)}
                            aria-label="Pin post"
                          >
                            <IconPin size={16} />
                          </ActionIcon>
                        )}

                        {canDelete && (
                          <ActionIcon
                            variant="light"
                            color="red"
                            onClick={() => void handleDeletePost(post.id)}
                            aria-label="Delete post"
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Group>

                    <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                      {post.content}
                    </Text>

                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant={isLiked ? 'filled' : 'light'}
                        color={isLiked ? 'brand' : 'gray'}
                        leftSection={<IconThumbUp size={14} />}
                        onClick={() => void handleToggleLike(post)}
                      >
                        {post.likes}
                      </Button>

                      <Button
                        size="xs"
                        variant="light"
                        color="gray"
                        leftSection={<IconMessageCircle size={14} />}
                        onClick={() => void handleToggleComments(post.id)}
                      >
                        {post.commentsCount} komen
                      </Button>
                    </Group>

                    {isExpanded && (
                      <Stack gap="xs" pt={6}>
                        {loadingCommentsByPost[post.id] ? (
                          <Group justify="center" py={8}>
                            <Loader size="sm" />
                          </Group>
                        ) : comments.length === 0 ? (
                          <Text size="xs" c="dimmed">
                            Belum ada komen.
                          </Text>
                        ) : (
                          comments.map((comment) => {
                            const canDeleteComment = isAdmin || comment.authorToken === authorToken;

                            return (
                              <Paper key={comment.id} withBorder p="xs" radius="sm">
                                <Group justify="space-between" align="flex-start" wrap="nowrap">
                                  <div>
                                    <Text size="xs" fw={600}>
                                      {comment.authorName}
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                      {formatDateTime(comment.createdAt)}
                                    </Text>
                                    <Text size="sm" mt={2}>
                                      {comment.content}
                                    </Text>
                                  </div>

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
                              </Paper>
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
                </Paper>
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

      <FAB
        label="Buat post baharu"
        icon={<IconMessagePlus size={24} />}
        onClick={() => setIsPostModalOpen(true)}
      />

      <Modal
        opened={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        title="Cipta Post"
        centered
      >
        <Stack>
          <Textarea
            minRows={4}
            autosize
            value={newPostContent}
            onChange={(event) => setNewPostContent(event.currentTarget.value)}
            placeholder="Kongsi soalan, pengalaman, atau tip temuduga anda..."
          />

          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              {isGuestReady ? `Dipost sebagai: ${guestName || 'Tetamu'}` : 'Menyediakan profil tetamu...'}
            </Text>
            <Button onClick={() => void handleCreatePost()} loading={isSubmittingPost}>
              Hantar
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={isAnnouncementModalOpen}
        onClose={() => setIsAnnouncementModalOpen(false)}
        title="Kemaskini Pengumuman"
        centered
      >
        <Stack>
          <Textarea
            minRows={4}
            autosize
            value={announcementDraft}
            onChange={(event) => setAnnouncementDraft(event.currentTarget.value)}
            placeholder="Tulis pengumuman penting untuk semua calon..."
          />

          <Group justify="flex-end">
            <Button onClick={() => void handleSaveAnnouncement()} loading={isSubmittingAnnouncement}>
              Simpan
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
