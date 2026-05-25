# Blog Platform — Project Master Plan

## Why We Started This
Shahzaib is a Full Stack Web Developer (7+ years experience) based in Dubai, currently working at PSI Real Estate. He completed a 20-hour Next.js course and wants to build real projects for his GitHub and portfolio that demonstrate professional-level skills — not tutorial clones, but something with real architecture, real roles, and real features that mirrors how production CMS platforms work.

## What We Are Building
A full-featured blog/CMS platform with:
- Multiple user roles with different permissions
- A rich text editor (like WordPress)
- A subscriber reading system with progress tracking
- An analytics dashboard with date-range filters
- Comment system with nested replies and moderation
- Newsletter system
- Notification system
- Full audit logging
- Media library

## Core Philosophy & Approach
- **No TypeScript** — keeping it plain JavaScript so focus stays on concepts not syntax
- **No shortcuts** — every decision explained like a teacher, concept first then code
- **Market-ready patterns** — using the same architecture patterns used in production CMS platforms
- **One step at a time** — each step fully understood before moving to the next
- **App Router** — using Next.js 14 App Router, not Pages Router

## User Roles
| Role | Purpose |
|---|---|
| Admin | Full access — manages everything |
| Writer | Creates and submits posts for review |
| Editor | Reviews and approves/rejects posts from writers |
| Subscriber | Personal reading dashboard, tracks progress through series |
| Guest | Public — reads published posts only |

## Tech Stack
| Technology | Purpose |
|---|---|
| Next.js 14 (App Router) | Frontend + Backend framework |
| MongoDB Atlas | Database (free cloud tier) |
| Mongoose | MongoDB schema modeling |
| NextAuth.js | Authentication and session management |
| Tiptap | Rich text editor (like WordPress editor) |
| Tailwind CSS | Styling |
| bcryptjs | Password hashing |
| Recharts | Charts for analytics dashboard |
| React Hook Form | Form management |
| slugify | Auto-generate URL slugs from titles |
| date-fns | Date formatting and range calculations |
| Vercel | Deployment |

## Database Collections (12 Models)
| Model | Purpose |
|---|---|
| User | All users across all roles |
| Post | Blog articles |
| Category | Post categories |
| Tag | Post tags (many per post) |
| Series | A collection of ordered posts |
| View | Individual view events for analytics |
| ReadProgress | Subscriber reading history and bookmarks |
| Comment | Post comments with nested reply support |
| Newsletter | Email campaigns sent to subscribers |
| Notification | In-app notifications for all roles |
| AuditLog | Permanent record of all admin actions |
| Media | Uploaded files and image library |

## Key Architecture Decisions & Why

### Why a separate `views` collection instead of a counter on the post
Storing each view as its own document with a timestamp is what makes the analytics dashboard possible. You can query "views this week vs last week" or "top posts last 6 months" by filtering on the `viewedAt` date. A single counter number can never answer those questions.

### Why `readProgress` is its own collection
One document per user-post pair. Makes queries like "all posts this user bookmarked" or "how many parts of this series has this user read" simple aggregation queries. Cleaner than arrays stored inside user documents.

### Why posts have 3 statuses (draft / pending / published)
This models a real editorial workflow. Writer saves draft → submits for review (pending) → editor/admin approves → published. This is how WordPress and every CMS works.

### Why `parentId` on Comment references itself
A comment with `parentId: null` is top-level. A reply stores the parent comment's `_id` in `parentId`. This self-referencing pattern supports infinite nesting depth without any extra collections.

### Why AuditLog uses a polymorphic reference pattern
Actions can target Posts, Users, Comments, or anything else. Instead of separate log collections per type, `targetType` + `targetId` together identify what was affected. Write-once, never deleted.

### Why the MongoDB connection uses a singleton/cache pattern
Next.js API routes are serverless functions. Without caching, every request opens a new MongoDB connection, exhausting the connection pool in minutes. The `global.mongoose` cache reuses the connection across requests.

## Folder Structure
```
blog-app/
├── app/
│   ├── (public)/         ← public-facing pages
│   ├── (auth)/           ← login, register
│   ├── blog/             ← /blog and /blog/[slug]
│   ├── category/[slug]/
│   ├── tag/[slug]/
│   ├── series/[slug]/
│   ├── search/
│   ├── reader/           ← subscriber dashboard
│   ├── dashboard/        ← admin/writer/editor dashboard
│   └── api/              ← all API routes
├── lib/
│   ├── mongodb.js        ← DB connection singleton
│   ├── auth.js           ← NextAuth config
│   └── utils.js          ← slugify, date helpers
├── models/               ← all 12 Mongoose models
├── components/
│   ├── ui/               ← Button, Input, Badge, Modal
│   ├── blog/             ← PostCard, PostGrid, TagList
│   ├── dashboard/        ← Sidebar, StatCard, Charts
│   ├── editor/           ← TiptapEditor, ImageUpload
│   ├── reader/           ← ProgressBar, BookmarkBtn
│   └── layout/           ← Navbar, Footer, Layouts
├── middleware.js          ← route protection by role
├── CLAUDE.md             ← AI context file
├── PROGRESS.md           ← current progress tracker
├── PROJECT.md            ← this file
└── .env.local            ← environment variables (never commit)
```

## Build Order (15 Steps)
1. Project setup — create app, install packages
2. MongoDB connection — lib/mongodb.js singleton
3. All 12 Mongoose models
4. NextAuth setup — login, sessions, role in token
5. Middleware — route protection by role
6. Public blog pages — homepage, /blog, /blog/[slug]
7. View tracking — log view document on each article visit
8. Dashboard layout + sidebar — role-aware navigation
9. Post CRUD — list, create (Tiptap), edit, delete, status flow
10. Categories, Tags, Series management
11. Analytics dashboard — Recharts, date range queries
12. User management — admin creates users, changes roles
13. Comment system — nested replies, moderation
14. Subscriber registration + reader dashboard
15. Newsletter, Notifications, Media library, Polish
