export interface AnnouncementItem {
  id: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostItem {
  id: string;
  content: string;
  authorName: string;
  authorToken: string;
  isPinned: boolean;
  likes: number;
  reposts: number;
  commentsCount: number;
  topComment?: CommentItem | null;
  sourceLink: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommentItem {
  id: string;
  content: string;
  authorName: string;
  authorToken: string;
  postId: string;
  createdAt: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  link: string | null;
  authorName: string;
  authorToken: string;
  createdAt: string;
  updatedAt: string;
}

export interface TipLabelItem {
  id: string;
  name: string;
}

export interface TipItem {
  id: string;
  content: string;
  authorName: string;
  authorToken: string;
  sourceLink: string | null;
  labels: TipLabelItem[];
  createdAt: string;
  updatedAt: string;
}

export interface BidangItem {
  id: string;
  name: string;
}

export interface SoalanItem {
  id: string;
  content: string;
  bidangId: string;
  bidangName: string;
  authorName: string;
  authorToken: string;
  sourceLink: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CaraDaftarStepItem {
  id: string;
  stepNo: number;
  title: string;
  content: string;
  linkUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
