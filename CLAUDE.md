# CLAUDE.md — AI Context File
> This file tells Claude everything about this project. Read this fully before helping with anything.
> If something is broken, fix only what is asked. Do not refactor or change anything else.

---

## Project Summary
A full-featured blog/CMS platform built with Next.js 14 (App Router), MongoDB, and Mongoose.
Developer: Shahzaib — Full Stack Web Developer, 6+ years experience, based in Dubai.
**No TypeScript** — plain JavaScript only throughout the entire project.

---

## Absolute Rules — Never Break These
1. **No TypeScript** — never add `.ts`, `.tsx` files or type annotations
2. **No template literals with types** — keep everything plain JS
3. **App Router only** — never use Pages Router patterns (`getServerSideProps`, `getStaticProps` etc.)
4. **Do not change working files** — if asked to fix one thing, touch only that file
5. **Tailwind config lives in `globals.css`** — there is no `tailwind.config.ts`, config goes in `@theme` blocks
6. **Never install new packages without asking** — always confirm first
7. **Always use the MongoDB singleton** — import `connectDB` from `@/lib/mongodb` in every API route and server component that touches the database. Never call `mongoose.connect()` directly.

---

## Tech Stack
- **Framework:** Next.js 14, App Router
- **Database:** MongoDB Atlas (free tier), database name: `blog-app`
- **ODM:** Mongoose
- **Auth:** NextAuth.js (credentials provider)
- **Editor:** Tiptap (rich text, outputs HTML string)
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Forms:** React Hook Form
- **Password hashing:** bcryptjs
- **Slugs:** slugify
- **Dates:** date-fns
- **Deployment:** Vercel (not yet deployed)

---

## User Roles
```
admin      → full access to everything
writer     → creates posts, submits for review, sees own analytics
editor     → reviews/approves/rejects writer posts, manages comments
subscriber → personal reading dashboard, tracks series progress, bookmarks
guest      → public, read-only, no dashboard
```

---

## Folder Structure
```
blog-app/
├── app/
│   ├── (public)/page.js          ← homepage
│   ├── blog/
│   │   ├── page.js               ← all posts
│   │   └── [slug]/page.js        ← single post
│   ├── category/[slug]/page.js
│   ├── tag/[slug]/page.js
│   ├── series/[slug]/page.js
│   ├── search/page.js
│   ├── (auth)/
│   │   ├── login/page.js
│   │   └── register/page.js
│   ├── reader/                   ← subscriber dashboard
│   │   ├── page.js
│   │   ├── bookmarks/page.js
│   │   ├── series/page.js
│   │   └── history/page.js
│   ├── dashboard/                ← admin/writer/editor
│   │   ├── page.js               ← analytics overview
│   │   ├── posts/
│   │   ├── categories/
│   │   ├── tags/
│   │   ├── series/
│   │   ├── users/
│   │   ├── subscribers/
│   │   ├── comments/
│   │   ├── newsletter/
│   │   ├── media/
│   │   └── analytics/
│   └── api/
│       ├── auth/[...nextauth]/route.js
│       ├── posts/
│       ├── categories/
│       ├── tags/
│       ├── series/
│       ├── users/
│       ├── views/
│       ├── comments/
│       ├── notifications/
│       ├── newsletter/
│       ├── media/
│       └── progress/
├── lib/
│   ├── mongodb.js    ← singleton DB connection — always import this
│   ├── auth.js       ← NextAuth config
│   └── utils.js      ← slugify helper, date helpers
├── models/
│   ├── User.js
│   ├── Post.js
│   ├── Category.js
│   ├── Tag.js
│   ├── Series.js
│   ├── View.js
│   ├── ReadProgress.js
│   ├── Comment.js
│   ├── Newsletter.js
│   ├── Notification.js
│   ├── AuditLog.js
│   └── Media.js
├── components/
│   ├── ui/           ← Button, Input, Badge, Modal
│   ├── blog/         ← PostCard, PostGrid, TagList, SeriesCard
│   ├── dashboard/    ← Sidebar, StatCard, PostsTable, AnalyticsChart
│   ├── editor/       ← TiptapEditor, ImageUpload, TagInput
│   ├── reader/       ← ProgressBar, BookmarkBtn, SeriesTracker
│   └── layout/       ← Navbar, Footer, DashboardLayout, ReaderLayout
├── middleware.js      ← route protection
├── CLAUDE.md         ← this file
├── PROGRESS.md       ← current step and what's done
├── PROJECT.md        ← full project plan and decisions
└── .env.local        ← never commit this file
```

---

## Models Overview
| Model | Collection | Key Fields |
|---|---|---|
| User | users | name, email, passwordHash, role (admin/writer/editor/subscriber) |
| Post | posts | title, slug, content (HTML), author ref, category ref, tags[], series ref, seriesOrder, status (draft/pending/published), views, publishedAt |
| Category | categories | name, slug, description, color |
| Tag | tags | name, slug, postCount |
| Series | series | title, slug, author ref, totalParts, status (ongoing/completed) |
| View | views | postId ref, viewedAt (timestamp) — analytics engine |
| ReadProgress | readprogresses | userId ref, postId ref, seriesId ref, bookmarked boolean, readAt |
| Comment | comments | postId ref, author ref, content, parentId ref (self — nested replies), status (pending/approved/rejected/spam), likes |
| Newsletter | newsletters | subject, content, sentBy ref, status (draft/scheduled/sending/sent/failed), scheduledAt, sentAt, recipientCount, openCount, clickCount |
| Notification | notifications | recipient ref, type (enum 9 types), message, link, read boolean, relatedPost/Comment/Series refs |
| AuditLog | auditlogs | performedBy ref, action (enum), targetType, targetId, details — write-once, never delete |
| Media | media | filename, originalName, url, mimetype, size, uploadedBy ref, usedIn[] post refs, alt |

---

## Key Patterns Used in This Project

### MongoDB connection (always use this)
```js
import connectDB from '@/lib/mongodb'
await connectDB()
```

### Model import pattern (prevents hot reload errors)
```js
export default mongoose.models.Post || mongoose.model('Post', PostSchema)
```

### API route structure (App Router)
```js
export async function GET(request) { ... }
export async function POST(request) { ... }
```

### Getting session in server component
```js
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
const session = await getServerSession(authOptions)
```

### Getting session in client component
```js
'use client'
import { useSession } from 'next-auth/react'
const { data: session } = useSession()
```

---

## Environment Variables (.env.local)
```
MONGODB_URI=mongodb+srv://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

---

## Current Progress
See `PROGRESS.md` for the full step-by-step progress.
**Currently at: Step 4 — NextAuth Setup**

## Common Mistakes to Avoid in This Project
- Forgetting `await connectDB()` at the top of API routes
- Using `mongoose.model()` directly instead of the `mongoose.models.X ||` pattern
- Importing from wrong path — always use `@/` alias not relative `../../`
- Putting server-only code (mongoose, bcrypt) in client components
- Forgetting `'use client'` on components that use hooks or browser APIs
