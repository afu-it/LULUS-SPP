# LULUS SPP — Project Plan

## 1. Project Overview

| Item | Detail |
|---|---|
| **Project Name** | LULUS SPP |
| **Type** | Mobile-first Progressive Web App (PWA-ready) |
| **Framework** | Next.js 14+ (App Router) |
| **UI Library** | Mantine UI v7 |
| **Primary Color** | `#262e5f` |
| **Database** | Cloudflare D1 + Prisma ORM (`@prisma/adapter-d1`) |
| **Auth** | Custom JWT (Guest + Admin) |
| **Language** | Bilingual (Bahasa Melayu + English) |
| **Media** | Text-only (for now) |
| **Deployment** | Cloudflare Pages + Cloudflare Workers |

---

## 2. Tech Stack

- **Frontend:** Next.js (React 18), Mantine UI v7, Tabler Icons
- **Backend:** Next.js API Routes (App Router)
- **Database:** Cloudflare D1 via Prisma ORM (`@prisma/adapter-d1`)
- **Auth:** bcrypt-edge + JWT (jose) stored in httpOnly cookies
- **Runtime:** Edge Runtime (all API routes use `export const runtime = 'edge'`)
- **State/i18n:** Custom i18n context with JSON translation files
- **Deployment:** Cloudflare Pages + Cloudflare Workers (via `@cloudflare/next-on-pages`)

---

## 3. Navigation — Bottom Navbar (6 Items)

| # | Menu | Icon | Route |
|---|---|---|---|
| 1 | Home | `IconHome` | `/` |
| 2 | Nota SPP | `IconNotes` | `/nota` |
| 3 | Tips SPP | `IconBulb` | `/tips` |
| 4 | Soalan IV | `IconMessageQuestion` | `/soalan` |
| 5 | Cara Daftar | `IconClipboardList` | `/cara-daftar` |
| 6 | Settings | `IconSettings` | `/settings` |

- **Mobile:** Fixed bottom bar with icons + labels
- **Desktop:** Same bottom bar (consistent UX across devices)

---

## 4. Page Features

### 4.1 HOME (`/`)

- **Announcement Banner** — Pinned/sticky at top, admin-only editable
- **Feed (Threads-style)** — Scrollable post feed, newest first
- **Post Card** — Author display name, timestamp, text content, like/comment count
- **Create Post FAB** — Floating action button to compose new post
- **Guest** can view and post (display name saved in localStorage)
- Infinite scroll or "Load More" pagination

### 4.2 NOTA SPP (`/nota`)

- List of notes (cards) created by users
- Each note: title, text body, optional external link(s)
- Add / Edit / Delete for own notes (admin can manage all)
- Search / filter functionality

### 4.3 TIPS SPP (`/tips`)

- List of tips (cards) with **label/tag system**
- Default labels (can be extended by users):
  - Pemakaian
  - Tepati Masa
  - Tips Hotel / Parking
  - Cara Bercakap
  - Intonasi
  - Persediaan Dokumen
  - Keyakinan Diri
  - Penampilan
  - Soal Jawab
  - Lain-lain
- Users can **create new labels** when adding a tip
- Filter tips by label
- Add / Edit / Delete for own tips

### 4.4 LATEST SOALAN IV SPP (`/soalan`)

- List of interview questions (cards) tagged by **Bidang (Subject)**
- Default Bidang list (admin can add new bidang):
  - Bahasa Melayu
  - Bahasa Inggeris
  - Matematik
  - Sains
  - Pendidikan Islam
  - Sejarah
  - Geografi
  - Pendidikan Moral
  - Reka Bentuk & Teknologi (RBT)
  - Pendidikan Jasmani & Kesihatan (PJK)
  - Pendidikan Seni Visual
  - Muzik
  - Teknologi Maklumat & Komunikasi (TMK)
  - Bahasa Arab
  - Bahasa Tamil
  - Bahasa Cina
  - Prasekolah
  - Pendidikan Khas
  - Bimbingan & Kaunseling
  - Fizik
  - Kimia
  - Biologi
  - Perdagangan
  - Ekonomi
  - Perakaunan
  - Sains Komputer
  - Sains Sukan
  - TVET
- Filter by bidang
- Users can add questions with text + bidang tag
- Add / Edit / Delete for own entries

### 4.5 CARA DAFTAR SPP (`/cara-daftar`)

- **Admin-only** content management (rich text / markdown)
- Step-by-step registration guide for SPP
- Read-only for guests and regular users

### 4.6 SETTINGS (`/settings`)

- **Login / Logout** toggle
  - Guest mode (default — no login needed, can post with display name)
  - Admin login (username + password)
- **Language** toggle (Bahasa Melayu / English)
- **Theme** (optional: light/dark mode)
- **About** section

---

## 5. Database Schema (Prisma)

### Tables

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Admin {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}

model Post {
  id          String    @id @default(cuid())
  content     String
  authorName  String
  authorToken String
  isPinned    Boolean   @default(false)
  likes       Int       @default(0)
  comments    Comment[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Comment {
  id          String   @id @default(cuid())
  content     String
  authorName  String
  authorToken String
  postId      String
  post        Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
}

model Announcement {
  id        String   @id @default(cuid())
  content   String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Note {
  id          String   @id @default(cuid())
  title       String
  content     String
  link        String?
  authorName  String
  authorToken String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Tip {
  id          String       @id @default(cuid())
  content     String
  authorName  String
  authorToken String
  labels      TipToLabel[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model TipLabel {
  id   String       @id @default(cuid())
  name String       @unique
  tips TipToLabel[]
}

model TipToLabel {
  tip      Tip      @relation(fields: [tipId], references: [id], onDelete: Cascade)
  tipId    String
  label    TipLabel @relation(fields: [labelId], references: [id], onDelete: Cascade)
  labelId  String
  @@id([tipId, labelId])
}

model Soalan {
  id          String   @id @default(cuid())
  content     String
  bidangId    String
  bidang      Bidang   @relation(fields: [bidangId], references: [id])
  authorName  String
  authorToken String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Bidang {
  id     String   @id @default(cuid())
  name   String   @unique
  soalan Soalan[]
}

model CaraDaftarStep {
  id        String   @id @default(cuid())
  stepNo    Int
  title     String
  content   String
  linkUrl   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Field Notes

- **`authorToken`** — A UUID string generated in the user's browser and stored in localStorage. Used to verify ownership for edit/delete operations since there is no user registration.
- **`Soalan.bidangId`** — Foreign key relation to the `Bidang` model (replaces plain string field for referential integrity).
- **`Comment`** — Linked to `Post` with cascade delete (deleting a post removes all its comments).
- **`CaraDaftarStep`** — Replaces the single-row `CaraDaftar` model with a multi-step structure for ordered registration guide steps.

### D1 Migration & Seed Workflow

Since Prisma Migrate does not support D1 directly, use this workflow:

```bash
# 0. Generate bcrypt hash for admin password (run once, copy hash into seed.sql)
node -e "const b=require('bcrypt-edge');console.log(b.hashSync('LulusSPP2026!',10))"

# 1. Generate migration SQL from schema changes
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script \
  > prisma/migrations/0001_init.sql

# 2. Apply migration to local D1 (development)
npx wrangler d1 execute lulus-spp-db --local --file=prisma/migrations/0001_init.sql

# 3. Apply migration to remote D1 (production)
npx wrangler d1 execute lulus-spp-db --remote --file=prisma/migrations/0001_init.sql

# 4. Seed the database (local)
npx wrangler d1 execute lulus-spp-db --local --file=prisma/seed.sql

# 5. Seed the database (production)
npx wrangler d1 execute lulus-spp-db --remote --file=prisma/seed.sql

# 6. Generate Prisma Client
npx prisma generate
```

Seed SQL (`prisma/seed.sql`) should include:
- Default admin user (username: `admin`, passwordHash from bcrypt-edge)
- Default tip labels (Pemakaian, Tepati Masa, etc.)
- Default bidang list (Bahasa Melayu, Sains, Matematik, etc.)

---

## 6. Authentication Flow

| Role | Access |
|---|---|
| **Guest** | View all pages, create posts/notes/tips/soalan (display name saved in localStorage) |
| **Admin** | All guest permissions + manage announcements, manage Cara Daftar, delete any content, pin posts, manage bidang list |

### Admin Credentials (Initial)

- **Username:** `admin`
- **Password:** `LulusSPP2026!`

### Auth Implementation

- Password hashed with **bcrypt-edge** (lightweight, Edge Runtime compatible)
- JWT token generated with **jose** library
- Token stored in **httpOnly cookie** (7-day expiry)
- Next.js middleware (`src/middleware.ts`) checks admin-only API routes
- All API routes run on **Edge Runtime** (`export const runtime = 'edge'`)
- No NextAuth.js — Edge Runtime + D1 requires custom JWT approach
- Guest users: no auth required, display name + authorToken stored in **localStorage**

---

## 7. Folder Structure

```
LULUS SPP/
├── prisma/
│   ├── schema.prisma          # Database schema (Cloudflare D1)
│   ├── migrations/            # SQL migration files (generated by prisma migrate diff)
│   └── seed.sql               # SQL seed script (admin, labels, bidang)
├── public/
│   ├── icons/                 # App icons
│   └── manifest.json          # PWA manifest (optional)
├── src/
│   ├── middleware.ts          # Edge middleware (admin route protection)
│   ├── app/
│   │   ├── layout.tsx         # Root layout + Mantine + i18n providers
│   │   ├── page.tsx           # HOME page
│   │   ├── nota/
│   │   │   └── page.tsx       # NOTA SPP page
│   │   ├── tips/
│   │   │   └── page.tsx       # TIPS SPP page
│   │   ├── soalan/
│   │   │   └── page.tsx       # LATEST SOALAN IV page
│   │   ├── cara-daftar/
│   │   │   └── page.tsx       # CARA DAFTAR page
│   │   ├── settings/
│   │   │   └── page.tsx       # SETTINGS page
│   │   └── api/
│   │       ├── auth/
│   │       │   └── route.ts   # Login / verify (Edge Runtime)
│   │       ├── posts/
│   │       │   ├── route.ts   # CRUD posts (Edge Runtime)
│   │       │   └── [id]/
│   │       │       ├── route.ts       # Single post ops (Edge Runtime)
│   │       │       ├── comments/
│   │       │       │   ├── route.ts   # GET/POST comments (Edge Runtime)
│   │       │       │   └── [cid]/
│   │       │       │       └── route.ts   # DELETE comment (Edge Runtime)
│   │       │       └── like/
│   │       │           └── route.ts   # Toggle like (Edge Runtime)
│   │       ├── announcements/
│   │       │   ├── route.ts   # GET/POST announcements (Edge Runtime, admin)
│   │       │   └── [id]/
│   │       │       └── route.ts   # PUT/DELETE announcement (Edge Runtime, admin)
│   │       ├── notes/
│   │       │   ├── route.ts   # GET/POST notes (Edge Runtime)
│   │       │   └── [id]/
│   │       │       └── route.ts   # PUT/DELETE note (Edge Runtime)
│   │       ├── tips/
│   │       │   ├── route.ts   # GET/POST tips (Edge Runtime)
│   │       │   └── [id]/
│   │       │       └── route.ts   # PUT/DELETE tip (Edge Runtime)
│   │       ├── labels/
│   │       │   ├── route.ts   # GET/POST tip labels (Edge Runtime)
│   │       │   └── [id]/
│   │       │       └── route.ts   # DELETE label (Edge Runtime, admin)
│   │       ├── soalan/
│   │       │   ├── route.ts   # GET/POST soalan (Edge Runtime)
│   │       │   └── [id]/
│   │       │       └── route.ts   # PUT/DELETE soalan (Edge Runtime)
│   │       ├── bidang/
│   │       │   ├── route.ts   # GET/POST bidang (Edge Runtime, admin)
│   │       │   └── [id]/
│   │       │       └── route.ts   # DELETE bidang (Edge Runtime, admin)
│   │       └── cara-daftar/
│   │           ├── route.ts   # GET/POST CaraDaftarStep (Edge Runtime, admin)
│   │           └── [id]/
│   │               └── route.ts   # PUT/DELETE step (Edge Runtime, admin)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── BottomNavbar.tsx    # Fixed bottom navigation
│   │   │   └── AppShell.tsx        # Main app layout wrapper
│   │   ├── home/
│   │   │   ├── AnnouncementBanner.tsx
│   │   │   ├── PostCard.tsx
│   │   │   ├── PostFeed.tsx
│   │   │   └── CreatePostModal.tsx
│   │   ├── nota/
│   │   │   ├── NoteCard.tsx
│   │   │   └── CreateNoteModal.tsx
│   │   ├── tips/
│   │   │   ├── TipCard.tsx
│   │   │   ├── CreateTipModal.tsx
│   │   │   └── LabelFilter.tsx
│   │   ├── soalan/
│   │   │   ├── SoalanCard.tsx
│   │   │   ├── CreateSoalanModal.tsx
│   │   │   └── BidangFilter.tsx
│   │   └── common/
│   │       ├── FAB.tsx             # Floating action button
│   │       ├── EmptyState.tsx
│   │       └── ConfirmModal.tsx
│   ├── lib/
│   │   ├── prisma.ts          # Prisma + D1 adapter (PrismaD1)
│   │   ├── auth.ts            # JWT sign / verify helpers
│   │   └── constants.ts       # App-wide constants
│   ├── hooks/
│   │   ├── useAuth.ts         # Auth context hook
│   │   └── useGuestName.ts    # localStorage display name + authorToken hook
│   ├── providers/
│   │   ├── AuthProvider.tsx   # Auth context provider
│   │   └── I18nProvider.tsx   # Language context provider
│   ├── theme/
│   │   └── theme.ts           # Mantine theme config (#262e5f)
│   ├── types/
│   │   └── cloudflare.d.ts    # CloudflareEnv interface (D1 binding types)
│   └── i18n/
│       ├── ms.json            # Bahasa Melayu translations
│       └── en.json            # English translations
├── .env                       # Environment variables (JWT_SECRET, etc.)
├── .gitignore
├── wrangler.toml              # Cloudflare Workers / D1 configuration
├── package.json
├── tsconfig.json
├── next.config.js
└── plan.md                    # This file
```

---

## 8. Mantine Theme Configuration

```typescript
// src/theme/theme.ts
import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'brand',
  colors: {
    brand: [
      '#e8eaf6', // 0 - lightest
      '#c5cae9', // 1
      '#9fa8da', // 2
      '#7986cb', // 3
      '#5c6bc0', // 4
      '#3f51b5', // 5
      '#3949ab', // 6
      '#303f9f', // 7
      '#262e5f', // 8 - PRIMARY
      '#1a237e', // 9 - darkest
    ],
  },
  primaryShade: 8,
  fontFamily: 'Inter, sans-serif',
  defaultRadius: 'md',
});
```

---

## 9. Wrangler Configuration

```toml
# wrangler.toml
name = "lulus-spp"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".vercel/output/static"

[[d1_databases]]
binding = "DB"
database_name = "lulus-spp-db"
database_id = "<YOUR_D1_DATABASE_ID>"
```

> **Note:** The `.vercel/output/static` path is correct — `@cloudflare/next-on-pages` reuses Vercel's build output format internally when deploying to Cloudflare Pages.

---

## 10. Prisma D1 Adapter Usage

All API routes use the Prisma D1 adapter to connect to Cloudflare D1 on the edge:

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import { getRequestContext } from '@cloudflare/next-on-pages';

export function getPrisma() {
  const { env } = getRequestContext();
  const adapter = new PrismaD1(env.DB);
  return new PrismaClient({ adapter });
}
```

Usage in any API route:

```typescript
// src/app/api/posts/route.ts
import { getPrisma } from '@/lib/prisma';

export const runtime = 'edge';

export async function GET() {
  const prisma = getPrisma();
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    include: { comments: true },
  });
  return Response.json(posts);
}
```

### CloudflareEnv Type Definition

```typescript
// src/types/cloudflare.d.ts
interface CloudflareEnv {
  DB: D1Database;
}

declare module '@cloudflare/next-on-pages' {
  export function getRequestContext(): {
    env: CloudflareEnv;
    ctx: ExecutionContext;
  };
}
```

---

## 11. API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth` | Public | Admin login (returns JWT) |
| GET | `/api/auth` | Admin | Verify token |
| GET | `/api/posts` | Public | List posts (paginated) |
| POST | `/api/posts` | Public | Create post |
| GET | `/api/posts/[id]` | Public | Get single post with comments |
| DELETE | `/api/posts/[id]` | Owner/Admin | Delete post |
| PATCH | `/api/posts/[id]` | Admin | Pin/unpin post |
| GET | `/api/posts/[id]/comments` | Public | List comments for a post |
| POST | `/api/posts/[id]/comments` | Public | Add comment to post |
| DELETE | `/api/posts/[id]/comments/[cid]` | Owner/Admin | Delete comment |
| POST | `/api/posts/[id]/like` | Public | Toggle like on post |
| GET | `/api/announcements` | Public | Get active announcement |
| POST | `/api/announcements` | Admin | Create announcement |
| PUT | `/api/announcements/[id]` | Admin | Update announcement |
| DELETE | `/api/announcements/[id]` | Admin | Delete announcement |
| GET | `/api/notes` | Public | List notes |
| POST | `/api/notes` | Public | Create note |
| PUT | `/api/notes/[id]` | Owner/Admin | Update note |
| DELETE | `/api/notes/[id]` | Owner/Admin | Delete note |
| GET | `/api/tips` | Public | List tips (filter by label) |
| POST | `/api/tips` | Public | Create tip |
| PUT | `/api/tips/[id]` | Owner/Admin | Update tip |
| DELETE | `/api/tips/[id]` | Owner/Admin | Delete tip |
| GET | `/api/labels` | Public | List tip labels |
| POST | `/api/labels` | Public | Create new label |
| DELETE | `/api/labels/[id]` | Admin | Delete a tip label |
| GET | `/api/soalan` | Public | List soalan (filter by bidang) |
| POST | `/api/soalan` | Public | Create soalan |
| PUT | `/api/soalan/[id]` | Owner/Admin | Update soalan |
| DELETE | `/api/soalan/[id]` | Owner/Admin | Delete soalan |
| GET | `/api/bidang` | Public | List bidang |
| POST | `/api/bidang` | Admin | Create new bidang |
| DELETE | `/api/bidang/[id]` | Admin | Delete bidang |
| GET | `/api/cara-daftar` | Public | List all cara daftar steps |
| POST | `/api/cara-daftar` | Admin | Create new step |
| PUT | `/api/cara-daftar/[id]` | Admin | Update step |
| DELETE | `/api/cara-daftar/[id]` | Admin | Delete step |

---

## 12. Implementation Phases

### Phase 1 — Foundation (Setup)
1. Initialize Next.js project with TypeScript
2. Install & configure Mantine UI v7 with custom theme (`#262e5f`)
3. Set up Prisma with Cloudflare D1 + `@prisma/adapter-d1` + define schema
4. Generate migration SQL via `prisma migrate diff` and apply with `wrangler d1 execute`
5. Create seed SQL script (admin user, default labels, default bidang list) and apply via `wrangler d1 execute`
6. Build bottom navbar component + responsive app shell
7. Set up i18n (BM / EN) with translation files

### Phase 2 — Auth & Settings
8. Implement admin login API (bcrypt-edge + JWT on Edge Runtime)
9. Create AuthProvider context + useAuth hook
10. Implement guest name + authorToken system (localStorage + useGuestName hook)
11. Build Settings page (login/logout, language toggle)

### Phase 3 — Core Pages
12. **HOME** — Announcement banner + post feed + comments + likes + create post modal
13. **NOTA SPP** — Note list + CRUD + link support
14. **TIPS SPP** — Tip list + label system + create label + filter
15. **SOALAN IV** — Soalan list + bidang filter + CRUD
16. **CARA DAFTAR** — Admin-managed multi-step content page with editor

### Phase 4 — Polish & Deploy
17. Mobile responsiveness fine-tuning
18. Loading states, error handling, empty states
19. Seed demo data for testing
20. PWA manifest + icons (optional)
21. Deploy to Cloudflare Pages (`wrangler pages deploy`)

---

## 13. Key Design Decisions

| Decision | Rationale |
|---|---|
| **Mobile-first bottom navbar** | Easier thumb reach on mobile; consistent on desktop |
| **Mantine UI** | Comprehensive component library, built-in dark mode, accessible |
| **Cloudflare D1** | SQLite-compatible, globally distributed, zero-config on Cloudflare edge |
| **Edge Runtime** | Required for Cloudflare Workers; all API routes use Web-standard APIs |
| **No user registration** | Reduces friction — guests enter display name once, saved in localStorage |
| **authorToken ownership** | UUID in localStorage verifies edit/delete permissions without user accounts |
| **Admin-only auth** | Only admin needs real authentication; keeps UX simple |
| **Bilingual (BM/EN)** | Serves Malaysian users with language preference |
| **Custom labels & bidang** | Flexible taxonomy — users can add labels, admin can add bidang |

---

## 14. Dependencies (package.json)

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "@mantine/core": "^7.x",
    "@mantine/hooks": "^7.x",
    "@mantine/form": "^7.x",
    "@mantine/notifications": "^7.x",
    "@mantine/modals": "^7.x",
    "@tabler/icons-react": "^3.x",
    "@prisma/client": "^5.x",
    "@prisma/adapter-d1": "^5.x",
    "bcrypt-edge": "^0.x",
    "jose": "^5.x"
  },
  "devDependencies": {
    "prisma": "^5.x",
    "wrangler": "^3.x",
    "@cloudflare/next-on-pages": "^1.x",
    "@cloudflare/workers-types": "^4.x",
    "typescript": "^5.x",
    "@types/react": "^18.x",
    "postcss": "^8.x",
    "postcss-preset-mantine": "^1.x",
    "postcss-simple-vars": "^7.x"
  }
}
```

### Install Commands

```bash
# 1. Initialize project
pnpm create next-app@latest lulus-spp --typescript --app --src-dir --tailwind=false

# 2. Mantine UI + icons
pnpm add @mantine/core @mantine/hooks @mantine/form @mantine/notifications @mantine/modals @tabler/icons-react

# 3. Mantine PostCSS
pnpm add -D postcss postcss-preset-mantine postcss-simple-vars

# 4. Prisma + D1 adapter
pnpm add @prisma/client @prisma/adapter-d1
pnpm add -D prisma

# 5. Auth (Edge-compatible)
pnpm add bcrypt-edge jose

# 6. Cloudflare tooling
pnpm add -D wrangler @cloudflare/next-on-pages @cloudflare/workers-types

# 7. Initialize Prisma
npx prisma init --datasource-provider sqlite
```

---

## 15. Cloudflare Limitations & Workarounds

| Limitation | Workaround |
|---|---|
| Prisma Migrate does not support D1 directly | Generate SQL via `prisma migrate diff`, then apply with `wrangler d1 execute` |
| No persistent file system | Use Cloudflare R2 for future file/image uploads |
| Edge Runtime does not support Node.js APIs | Use only Web-standard APIs in all API routes |
| D1 is eventually consistent on global replication | Acceptable for this app's use case |

---

*Last updated: 25 February 2026*
