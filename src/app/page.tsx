"use client";

import { useEffect, useRef, useState } from "react";
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
  Paper,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";
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
  IconTrash,
  IconUserCircle,
  IconBell,
  IconX,
} from "@tabler/icons-react";
import { useWindowScroll } from "@mantine/hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notifications } from "@mantine/notifications";
import { EmptyState } from "@/components/common/EmptyState";
import { FAB } from "@/components/common/FAB";
import { formatRelativeTime } from "@/lib/date";
import { useAuth } from "@/hooks/useAuth";
import { useGuestName } from "@/hooks/useGuestName";
import type { PostItem } from "@/types/entities";

const POSTS_PAGE_SIZE = 10;
const LIKED_POSTS_STORAGE_KEY = "lulus-spp:liked-posts";
const REPOSTED_POSTS_STORAGE_KEY = "lulus-spp:reposted-posts";
const DISMISSED_BANNER_KEY = "lulus-spp:dismissed-banner";
const LIKED_COMMENTS_STORAGE_KEY = "lulus-spp:liked-comments";
const REPOSTED_COMMENTS_STORAGE_KEY = "lulus-spp:reposted-comments";

function sortPosts(items: PostItem[]) {
  return [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

type StatusOption = "online" | "busy" | "offline";

const STATUS_COLORS: Record<StatusOption, string> = {
  online: "#22c55e",
  busy: "#f59e0b",
  offline: "#6b7280",
};

const STATUS_KEY = "lulus-spp:status";

function resolveCreditHref(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(trimmed) && !/\s/.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return "";
}

function resolveCreditLabel(value: string) {
  const raw = value.trim();
  const href = resolveCreditHref(raw);
  if (!href) return raw || "Sumber";

  try {
    const hostname = new URL(href).hostname.replace(/^www\./i, "");
    const [domain] = hostname.split(".");
    return domain || raw || "Sumber";
  } catch {
    return raw || "Sumber";
  }
}

export default function HomePage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { authorToken, isReady: isGuestReady } = useGuestName();

  const [posts, setPosts] = useState<PostItem[]>([]);
  const [connectorLineByPost, setConnectorLineByPost] = useState<
    Record<string, { top: number; bottom: number }>
  >({});
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [repostedPostIds, setRepostedPostIds] = useState<string[]>([]);
  const [likedCommentIds, setLikedCommentIds] = useState<string[]>([]);
  const [repostedCommentIds, setRepostedCommentIds] = useState<string[]>([]);

  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [postOffset, setPostOffset] = useState(0);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [status, setStatus] = useState<StatusOption>("online");

  // Sticky banner
  const [banner, setBanner] = useState<{ id: string; content: string } | null>(
    null,
  );
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  const [scroll] = useWindowScroll();
  const lastScrollYRef = useRef(0);
  const [showFAB, setShowFAB] = useState(true);
  const mainAvatarRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lineContainerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const commentAvatarRefs = useRef<Record<string, HTMLButtonElement | null>>(
    {},
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(
      STATUS_KEY,
    ) as StatusOption | null;
    if (stored && stored in STATUS_COLORS) setStatus(stored);
  }, []);

  // Fetch banner
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/banner");
        if (res.ok) {
          const data = (await res.json()) as {
            item: { id: string; content: string } | null;
          };
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
    window.localStorage.setItem(
      LIKED_POSTS_STORAGE_KEY,
      JSON.stringify(likedPostIds),
    );
  }, [likedPostIds]);

  // Comment Local Storage effects
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
    window.localStorage.setItem(
      LIKED_COMMENTS_STORAGE_KEY,
      JSON.stringify(likedCommentIds),
    );
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
    window.localStorage.setItem(
      REPOSTED_COMMENTS_STORAGE_KEY,
      JSON.stringify(repostedCommentIds),
    );
  }, [repostedCommentIds]);

  useEffect(() => {
    function recalculateConnectorLine() {
      setConnectorLineByPost(() => {
        const next: Record<string, { top: number; bottom: number }> = {};

        for (const post of posts) {
          if (!post.topComment) continue;

          const mainAvatar = mainAvatarRefs.current[post.id];
          const lineContainer = lineContainerRefs.current[post.id];
          const commentAvatar = commentAvatarRefs.current[post.id];
          if (!mainAvatar || !lineContainer || !commentAvatar) continue;

          const mainRect = mainAvatar.getBoundingClientRect();
          const lineRect = lineContainer.getBoundingClientRect();
          const commentRect = commentAvatar.getBoundingClientRect();

          // Keep the connector strictly in the gap between both avatars.
          const startY = mainRect.bottom + 4;
          const endY = commentRect.top - 4;
          if (endY <= startY) continue;

          const top = Math.round(startY - lineRect.top);
          const bottom = Math.round(lineRect.bottom - endY);

          next[post.id] = { top, bottom };
        }

        return next;
      });
    }

    const rafId = window.requestAnimationFrame(recalculateConnectorLine);
    window.addEventListener("resize", recalculateConnectorLine);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", recalculateConnectorLine);
    };
  }, [posts]);

  async function loadPosts(reset = false) {
    const offset = reset ? 0 : postOffset;
    const setLoading = reset ? setIsLoadingPosts : setIsLoadingMore;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/posts?limit=${POSTS_PAGE_SIZE}&offset=${offset}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
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
        color: "red",
        title: "Ralat",
        message: "Tidak dapat memuat senarai post.",
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isLiked ? "unlike" : "like" }),
      });

      const data = (await response.json()) as { likes?: number };

      if (!response.ok || typeof data.likes !== "number") {
        throw new Error("Unable to toggle like");
      }

      setPosts((prev) =>
        prev.map((item) =>
          item.id === post.id ? { ...item, likes: Number(data.likes) } : item,
        ),
      );

      setLikedPostIds((prev) => {
        if (isLiked) {
          return prev.filter((id) => id !== post.id);
        }

        return [...prev, post.id];
      });
    } catch {
      notifications.show({
        color: "red",
        title: "Ralat",
        message: "Tidak dapat kemas kini like.",
      });
    }
  }

  async function handleToggleRepost(post: PostItem) {
    const isReposted = repostedPostIds.includes(post.id);
    const action = isReposted ? "unrepost" : "repost";

    try {
      const response = await fetch(`/api/posts/${post.id}/repost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = (await response.json()) as { reposts?: number };

      if (!response.ok || typeof data.reposts !== "number") {
        throw new Error("Unable to repost");
      }

      setPosts((prev) =>
        prev.map((item) =>
          item.id === post.id
            ? { ...item, reposts: Number(data.reposts) }
            : item,
        ),
      );

      setRepostedPostIds((prev) => {
        if (isReposted) {
          return prev.filter((id) => id !== post.id);
        }
        return [...prev, post.id];
      });

      // silent — no notification for repost
    } catch {
      notifications.show({
        color: "red",
        message: "Tidak dapat mengemas kini repost.",
      });
    }
  }

  function handleToggleCommentLike(commentId: string) {
    setLikedCommentIds((prev) =>
      prev.includes(commentId)
        ? prev.filter((id) => id !== commentId)
        : [...prev, commentId],
    );
  }

  function handleToggleCommentRepost(commentId: string) {
    setRepostedCommentIds((prev) =>
      prev.includes(commentId)
        ? prev.filter((id) => id !== commentId)
        : [...prev, commentId],
    );
  }

  async function handleTogglePin(post: PostItem) {
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !post.isPinned }),
      });

      if (!response.ok) {
        throw new Error("Unable to toggle pin");
      }

      setPosts((prev) =>
        sortPosts(
          prev.map((item) =>
            item.id === post.id ? { ...item, isPinned: !item.isPinned } : item,
          ),
        ),
      );
    } catch {
      notifications.show({
        color: "red",
        message: "Tidak dapat kemas kini pin post.",
      });
    }
  }

  async function handleDeletePost(postId: string) {
    if (!authorToken) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorToken }),
      });

      if (!response.ok) {
        throw new Error("Unable to delete post");
      }

      setPosts((prev) => prev.filter((item) => item.id !== postId));
      notifications.show({ color: "green", message: "Post berjaya dipadam." });
    } catch {
      notifications.show({ color: "red", message: "Tidak dapat padam post." });
    }
  }

  function handleOpenPost(postId: string) {
    router.push(`/posts/${postId}`);
  }

  return (
    <Container px={0} py={0}>
      {/* ── Compact Sticky Header ── */}
      <Box
        pos="sticky"
        top={0}
        bg="#181818"
        style={{
          zIndex: 100,
          borderBottom: "1px solid var(--mantine-color-default-border)",
          minHeight: 40,
          display: "flex",
          alignItems: "center",
        }}
        px="md"
        py={0}
      >
        <Group
          align="center"
          justify="space-between"
          wrap="nowrap"
          style={{ width: "100%" }}
        >
          {/* Left: status indicator */}
          {isAdmin ? (
            <Menu shadow="md" width={150} position="bottom-start">
              <Menu.Target>
                <Box
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    cursor: "pointer",
                  }}
                >
                  <Box
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: STATUS_COLORS[status],
                      boxShadow: `0 0 6px ${STATUS_COLORS[status]}`,
                    }}
                  />
                  <Text size="xs" c="dimmed" lh={1}>
                    Online
                  </Text>
                </Box>
              </Menu.Target>
              <Menu.Dropdown>
                {(["online", "busy", "offline"] as StatusOption[]).map((s) => (
                  <Menu.Item
                    key={s}
                    fw={status === s ? 700 : 400}
                    leftSection={
                      <Box
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: STATUS_COLORS[s],
                        }}
                      />
                    }
                    onClick={() => handleSetStatus(s)}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Box style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Box
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: STATUS_COLORS[status],
                  boxShadow: `0 0 6px ${STATUS_COLORS[status]}`,
                }}
              />
              <Text size="xs" c="dimmed" lh={1}>
                Online
              </Text>
            </Box>
          )}

          {/* Center: title */}
          <Text fw={800} size="md" lh={1} style={{ letterSpacing: "1px" }}>
            LULUS SPP
          </Text>

          {/* Right: icons */}
          <Group gap={4} align="center">
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
                  "linear-gradient(115deg, rgba(38,46,92,0.98) 0%, rgba(31,41,78,0.96) 45%, rgba(23,28,56,0.96) 100%)",
                border: "1px solid rgba(113,131,255,0.35)",
                boxShadow: "0 8px 20px rgba(8,10,22,0.35)",
              }}
            >
              <Group
                justify="space-between"
                align="flex-start"
                wrap="nowrap"
                gap="xs"
              >
                <Group gap={8} align="center" wrap="nowrap">
                  <Badge
                    size="xs"
                    variant="filled"
                    color="indigo"
                    style={{ letterSpacing: 0.3, textTransform: "uppercase" }}
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
                    window.localStorage.setItem(
                      DISMISSED_BANNER_KEY,
                      banner.id,
                    );
                  }}
                  style={{ color: "#c8d0ff", flexShrink: 0 }}
                >
                  <IconX size={14} />
                </ActionIcon>
              </Group>

              <Text
                size="sm"
                mt={8}
                style={{
                  color: "#edf1ff",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
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
                <Group wrap="nowrap" align="flex-start" gap={6}>
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
              const isOwner = Boolean(
                authorToken && authorToken === post.authorToken,
              );
              const canDelete = isOwner || isAdmin;
              const isLiked = likedPostIds.includes(post.id);
              const isReposted = repostedPostIds.includes(post.id);
              const topComment = post.topComment ?? null;
              const connectorLine = connectorLineByPost[post.id];
              const isCommentLiked = topComment
                ? likedCommentIds.includes(topComment.id)
                : false;
              const isCommentReposted = topComment
                ? repostedCommentIds.includes(topComment.id)
                : false;

              return (
                <Box key={post.id}>
                  <Box p="md" bg="#181818">
                    <Group wrap="nowrap" align="flex-start" gap={6}>
                      <ActionIcon
                        variant="transparent"
                        size={40}
                        radius="xl"
                        ref={(node) => {
                          mainAvatarRefs.current[post.id] = node;
                        }}
                      >
                        <IconUserCircle
                          size={40}
                          stroke={1.5}
                          color="var(--mantine-color-dimmed)"
                        />
                      </ActionIcon>
                      <Stack gap={0} style={{ flex: 1 }}>
                        <Group
                          justify="space-between"
                          align="flex-start"
                          wrap="nowrap"
                          mt={2}
                        >
                          <Group gap={6} align="baseline" mt={4}>
                            <Text
                              fw={600}
                              size="sm"
                              lh={1.2}
                              style={
                                post.authorToken === "admin" ||
                                post.authorToken === "admin-post"
                                  ? { color: "#262e5c" }
                                  : undefined
                              }
                            >
                              {post.authorName}
                            </Text>
                            <Text size="xs" c="dimmed" lh={1.2}>
                              {formatRelativeTime(post.createdAt)}
                            </Text>
                            {post.isPinned && (
                              <Badge
                                color="yellow"
                                variant="light"
                                leftSection={<IconPin size={12} />}
                              >
                                Pinned
                              </Badge>
                            )}
                          </Group>

                          <Menu position="bottom-end" withinPortal>
                            <Menu.Target>
                              <ActionIcon
                                variant="subtle"
                                color="gray"
                                aria-label="Settings"
                              >
                                <IconDots size={18} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item
                                leftSection={<IconLink size={14} />}
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    `${window.location.origin}/posts/${post.id}`,
                                  );
                                  notifications.show({
                                    message: "Pautan disalin.",
                                    color: "green",
                                  });
                                }}
                              >
                                Salin Pautan
                              </Menu.Item>
                              <Menu.Item
                                leftSection={<IconBookmark size={14} />}
                              >
                                Simpan (Akan datang)
                              </Menu.Item>

                              {isAdmin && (
                                <Menu.Item
                                  color={post.isPinned ? "yellow" : "gray"}
                                  leftSection={<IconPin size={14} />}
                                  onClick={() => void handleTogglePin(post)}
                                >
                                  {post.isPinned ? "Unpin Post" : "Pin Post"}
                                </Menu.Item>
                              )}

                              {canDelete && (
                                <>
                                  <Menu.Divider />
                                  <Menu.Item
                                    color="red"
                                    leftSection={<IconTrash size={14} />}
                                    onClick={() =>
                                      void handleDeletePost(post.id)
                                    }
                                  >
                                    Padam Post
                                  </Menu.Item>
                                </>
                              )}
                            </Menu.Dropdown>
                          </Menu>
                        </Group>

                        <Box
                          mt={2}
                          onClick={() => handleOpenPost(post.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <Text
                            size="sm"
                            mt={-4}
                            style={{ whiteSpace: "pre-wrap" }}
                          >
                            {post.content}
                          </Text>

                          {post.sourceLink &&
                            (() => {
                              const raw = post.sourceLink.trim();
                              const href = resolveCreditHref(raw);
                              const label = resolveCreditLabel(post.sourceLink);
                              return (
                                <>
                                  <Divider mt={3} mb={1} />
                                  <Box ta="right">
                                    <Text size="xs" c="#F3F5F7">
                                      Kredit:{" "}
                                      {href ? (
                                        <Anchor
                                          href={href}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          c="blue.4"
                                          onClick={(event) =>
                                            event.stopPropagation()
                                          }
                                        >
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
                        </Box>

                        <Group gap="md" mt={8}>
                          <Button
                            size="xs"
                            variant="transparent"
                            color={isLiked ? "red" : "gray"}
                            px={0}
                            leftSection={
                              <IconHeart
                                size={20}
                                fill={isLiked ? "red" : "transparent"}
                              />
                            }
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
                            onClick={() => handleOpenPost(post.id)}
                          >
                            {post.commentsCount}
                          </Button>

                          <Button
                            size="xs"
                            variant="transparent"
                            color={isReposted ? "green" : "gray"}
                            px={0}
                            leftSection={
                              <IconRepeat
                                size={20}
                                style={
                                  isReposted ? { color: "#22c55e" } : undefined
                                }
                              />
                            }
                            onClick={() => void handleToggleRepost(post)}
                          >
                            {post.reposts || 0}
                          </Button>
                        </Group>

                        {topComment && (
                          <Box
                            mt={16}
                            ml={-46}
                            w="calc(100% + 46px)"
                            onClick={() => handleOpenPost(post.id)}
                            style={{ cursor: "pointer" }}
                          >
                            <Group wrap="nowrap" align="flex-start" gap={6}>
                              <Box
                                ref={(node) => {
                                  lineContainerRefs.current[post.id] = node;
                                }}
                                style={{
                                  width: 40,
                                  position: "relative",
                                  display: "flex",
                                  justifyContent: "center",
                                  minHeight: 34,
                                }}
                              >
                                {connectorLine && (
                                  <Box
                                    style={{
                                      position: "absolute",
                                      left: "50%",
                                      transform: "translateX(-50%)",
                                      top: connectorLine.top,
                                      bottom: connectorLine.bottom,
                                      width: 2,
                                      borderRadius: 2,
                                      background: "rgba(164, 169, 178, 0.45)",
                                    }}
                                  />
                                )}
                                <ActionIcon
                                  variant="transparent"
                                  size={40}
                                  radius="xl"
                                  style={{ zIndex: 1 }}
                                  ref={(node) => {
                                    commentAvatarRefs.current[post.id] = node;
                                  }}
                                >
                                  <IconUserCircle
                                    size={40}
                                    stroke={1.5}
                                    color="var(--mantine-color-dimmed)"
                                  />
                                </ActionIcon>
                              </Box>
                              <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                                <Group
                                  justify="space-between"
                                  align="flex-start"
                                  wrap="nowrap"
                                  mt={2}
                                >
                                  <Group gap={6} align="baseline" mt={4}>
                                    <Text size="sm" fw={600} c="#d6d9df">
                                      {topComment.authorName}
                                    </Text>
                                    <Text size="xs" c="dimmed" lh={1.2}>
                                      {formatRelativeTime(topComment.createdAt)}
                                    </Text>
                                  </Group>
                                  <Menu position="bottom-end" withinPortal>
                                    <Menu.Target>
                                      <ActionIcon
                                        size="sm"
                                        variant="subtle"
                                        color="gray"
                                        aria-label="Settings comment"
                                        onClick={(event) =>
                                          event.stopPropagation()
                                        }
                                      >
                                        <IconDots size={16} />
                                      </ActionIcon>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                      <Menu.Item
                                        leftSection={<IconLink size={14} />}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          navigator.clipboard.writeText(
                                            `${window.location.origin}/posts/${post.id}#comment-${topComment.id}`,
                                          );
                                          notifications.show({
                                            message: "Pautan disalin.",
                                            color: "green",
                                          });
                                        }}
                                      >
                                        Salin Pautan
                                      </Menu.Item>
                                    </Menu.Dropdown>
                                  </Menu>
                                </Group>
                                <Text
                                  size="sm"
                                  c="#e7e9ee"
                                  style={{
                                    whiteSpace: "pre-wrap",
                                    overflowWrap: "anywhere",
                                  }}
                                >
                                  {topComment.content}
                                </Text>

                                <Group gap="md" mt={8}>
                                  <Button
                                    size="xs"
                                    variant="transparent"
                                    color={isCommentLiked ? "red" : "gray"}
                                    px={0}
                                    leftSection={
                                      <IconHeart
                                        size={20}
                                        fill={
                                          isCommentLiked ? "red" : "transparent"
                                        }
                                      />
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleCommentLike(topComment.id);
                                    }}
                                  >
                                    {isCommentLiked ? 1 : 0}
                                  </Button>

                                  <Button
                                    size="xs"
                                    variant="transparent"
                                    color="gray"
                                    px={0}
                                    leftSection={
                                      <IconMessageCircle size={20} />
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenPost(post.id);
                                    }}
                                  >
                                    0
                                  </Button>

                                  <Button
                                    size="xs"
                                    variant="transparent"
                                    color={isCommentReposted ? "green" : "gray"}
                                    px={0}
                                    leftSection={
                                      <IconRepeat
                                        size={20}
                                        style={
                                          isCommentReposted
                                            ? { color: "#22c55e" }
                                            : undefined
                                        }
                                      />
                                    }
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleCommentRepost(topComment.id);
                                    }}
                                  >
                                    {isCommentReposted ? 1 : 0}
                                  </Button>
                                </Group>
                              </Stack>
                            </Group>
                          </Box>
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
                <Button
                  variant="default"
                  onClick={() => void loadPosts(false)}
                  loading={isLoadingMore}
                >
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
          onClick={() => router.push("/buat-post")}
        />
      )}
    </Container>
  );
}
