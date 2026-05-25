# Blog Platform — Progress Tracker
> Update this file every session. It is the single source of truth for where the project stands.

---

## Current Status
**Active Step:** Step 4 — NextAuth Setup
**Last Updated:** Session 1
**Overall Progress:** Steps 1-3 complete ✅

---

## Completed Steps

### ✅ Step 1 — Project Setup
- Created Next.js 14 app with App Router, no TypeScript, Tailwind CSS
- Installed all packages: mongoose, next-auth, bcryptjs, slugify, date-fns, recharts, react-hook-form, tiptap (6 packages)

### ✅ Step 2 — MongoDB Connection
- Created `.env.local` with MONGODB_URI, NEXTAUTH_SECRET, NEXTAUTH_URL
- Created `lib/mongodb.js` — singleton connection pattern using global cache
- Created `app/api/test/route.js` — confirmed connection works
- MongoDB Atlas cluster set up on free tier (M0), database name: `blog-app`

### ✅ Step 3 — All 12 Mongoose Models
All models created in `/models/` folder:

| File | Status | Key Notes |
|---|---|---|
| User.js | ✅ | Roles: admin, writer, editor, subscriber |
| Category.js | ✅ | Has slug, color fields |
| Tag.js | ✅ | Has postCount for denormalized caching |
| Series.js | ✅ | Has author ref, totalParts, status |
| Post.js | ✅ | Has 3 statuses, series + seriesOrder, content is HTML string from Tiptap |
| View.js | ✅ | Lean model — postId + viewedAt timestamp only |
| ReadProgress.js | ✅ | userId + postId + bookmarked boolean |
| Comment.js | ✅ | Self-referencing parentId for nested replies, 4-state moderation |
| Newsletter.js | ✅ | 5 statuses, tracks recipientCount/openCount/clickCount |
| Notification.js | ✅ | 9 notification types, read boolean, links to related content |
| AuditLog.js | ✅ | Polymorphic targetType + targetId pattern, write-once |
| Media.js | ✅ | filename vs originalName, usedIn array tracks which posts use the image |

---

## Up Next

### ✅ Step 4 — NextAuth Setup
- Created lib/auth.js — credentials provider, jwt + session callbacks pass role through
- Created app/api/auth/[...nextauth]/route.js — 5 line handler
- Created and ran app/api/seed/route.js — seeded admin@blog.com / admin123
- Confirmed /api/auth/session returns {} (NextAuth running)
- DELETE the seed route after running

**What you have learned:**
- How NextAuth credentials provider works
- How to include the user role in the session/token
- How to access the session from server components and client components

### ✅ Step 5 — Middleware
- Created middleware.js in project root
- Protects /dashboard (admin/writer/editor only)
- Protects /reader (subscriber only)
- Redirects logged-in users away from /login and /register
- matcher limits middleware to only relevant routes

**What you have learned:**
- How middleware intercepts every request before it hits a page
- How to redirect based on role
- Protecting /dashboard, /reader routes

### ✅ Step 6 — Public Blog Pages
- Created lib/utils.js — createSlug, formatDate, timeAgo, truncate
- Updated app/layout.js with Navbar, Footer, AuthProvider
- Created AuthProvider.js — wraps SessionProvider for client-side session access
- Created Navbar.js — role-aware dashboard link, login/logout
- Created Footer.js
- Created API routes: /api/posts, /api/posts/[slug], /api/categories, /api/search
- Created pages: homepage, /blog, /blog/[slug], /category/[slug], /tag/[slug], /search
- View tracking on /api/posts/[slug] — creates View doc + increments post.views
- Dual search: category typeahead + article search with debounce (400ms)
- Installed @tailwindcss/typography for prose styling of Tiptap content
- Key patterns: lean(), Promise.all(), $inc, $regex, debounce

### ✅ Step 7 — Login & Register Pages
- Created app/(auth)/login/page.js — uses signIn(), redirect: false, role-based redirect after login
- Created app/(auth)/register/page.js — calls register API then auto signs in
- Created app/api/auth/register/route.js — validates, hashes password, creates subscriber user
- Key patterns: react-hook-form register/handleSubmit/watch, HTTP 201 status, never return password hash
- (auth) folder = Route Group — organizes files without affecting URL

### ✅ Step 8 — Dashboard Layout
- Created app/dashboard/layout.js — server component, double-checks session, wraps all pages
- Created DashboardHeader.js — user menu, invisible overlay pattern for dropdown
- Created DashboardSidebar.js — role-aware nav using navItems array + usePathname for active state
- Created app/dashboard/page.js — stats overview, role-aware queries, Promise.all for parallel fetching
- Created placeholder pages for all dashboard sections
- Key patterns: layout.js as shared frame, startsWith for active link detection, $gte date query

### ✅ Step 9 — Post CRUD with Tiptap Editor
- TiptapEditor.js — modular extensions, onMouseDown preventDefault, controlled component pattern
- TagInput.js — multi-select with suggestions, excludes already selected tags
- POST /api/posts — slug collision handling, role-based status restriction, Tag postCount increment
- GET+PUT+DELETE /api/posts/[id] — writer owns-their-own-posts check, AuditLog on status change
- GET+POST /api/tags, /api/series — supporting routes
- Posts list page — StatusBadge, role-aware query, router.refresh() after delete
- New post page — 3 buttons (draft/pending/publish) with role-based visibility
- Edit post page — reset() pre-fills form, Reject button for pending posts
- Key patterns: handleSubmit with action param, router.refresh(), $in operator, new:true in findByIdAndUpdate

### ✅ Step 10 — Categories, Tags, Series Management
- GET+POST /api/categories, tags, series — all three working
- GET+PUT+DELETE /api/categories/[id], tags/[id], series/[id]
- Safety checks before delete — blocks if posts exist (categories/series), cleans up with $pull (tags)
- Aggregation pipeline on categories and series pages — $lookup, $addFields, $filter, $arrayElemAt
- Inline edit pattern — editingId state swaps row between view and edit mode
- editData object pattern for series — one state object for multiple fields
- JSON.parse(JSON.stringify()) when passing MongoDB data server → client
- Key operators learned: $pull, $lookup, $addFields, $filter, $arrayElemAt, $project

### ✅ Step 11 — Analytics Dashboard + Unique View Tracking
- View model updated — fingerprint field (SHA-256 hash of IP+UserAgent), compound index
- Unique view logic — 24hr window per fingerprint per post, x-forwarded-for for real IP
- GET /api/analytics — period filters (week/lastweek/month/3months/6months), parallel queries
- $dateToString aggregation — groups views by day for chart data
- Top posts aggregation — $group by postId, $sort, $limit 5, $lookup posts
- Percentage change formula — ((current - previous) / previous) * 100
- Dashboard overview — mini area chart, week-over-week trend arrows
- Full analytics page — period filter buttons, bar chart, top posts with proportional bars
- Skeleton loading state on analytics page
- Key concepts: SHA-256 fingerprinting, $dateToString, skeleton UI, proportional bar visualization

### ✅ Step 12 — User Management
- Added isActive field to User model — deactivate without deleting
- Updated lib/auth.js — blocks deactivated users from logging in
- GET+POST /api/users — admin only, cannot create admin via UI
- PUT+DELETE /api/users/[id] — role change, deactivate/reactivate, hard delete only if no posts
- Self-protection — admin cannot change or delete their own account
- UsersClient.js — role filter tabs, inline role dropdown, deactivate/reactivate/delete
- Dynamic import for Post inside DELETE — avoids circular dependency
- Key patterns: .select('-password'), inline select for role change, opacity-50 for deactivated rows

### ✅ Step 13 — Comment System
- GET /api/comments?postId — fetches approved top-level comments with replies in parallel
- POST /api/comments — creates comment/reply, auto-approves admin/editor, notifies post author
- PUT /api/comments/[id] — moderation (status change) or content edit
- DELETE /api/comments/[id] — deletes comment AND all its replies ($deleteMany)
- CommentSection.js — recursive CommentItem component handles infinite nesting
- handleCommentDeleted filters local state — no refetch needed on delete
- CommentsClient.js — moderation queue, filter by status, approve/reject/spam buttons
- Key patterns: recursive React component, auto-approve by role, parallel reply fetching

### 🔄 Step 14 — Subscriber Reader Dashboard
- Register, track reading progress, bookmarks, series tracker

### 📋 Step 15 — Final Features
- Newsletter sending
- Notifications
- Media library
- Search
- Pagination
- SEO meta tags
- Deploy to Vercel

---

## Important Decisions Made So Far
- **Editor role added** — sits between writer and admin, approves/rejects posts
- **No TypeScript** — plain JavaScript throughout
- **Tiptap** chosen for rich text editor (not Quill, not slate) — React-based, modular, free
- **Recharts** for analytics charts
- **Bookmark handled inside ReadProgress** — no separate Bookmark model needed
- **AuditLog is write-once** — never updated or deleted, permanent record

---

## Known Issues / Things to Watch
- `.env.local` must be in root next to `package.json` — was placed in wrong folder initially
- MongoDB URI format: must include database name before `?` — `...mongodb.net/blog-app?...`
- Always restart `npm run dev` after changing `.env.local`
- The last line of every model: `mongoose.models.X || mongoose.model('X', Schema)` — prevents hot reload errors in Next.js
