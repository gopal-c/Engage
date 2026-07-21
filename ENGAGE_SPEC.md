# ENGAGE_SPEC.md

## Unified Internal Tools Portal for ValueAdd SoftTech

Engage is a unified portal that integrates three existing internal tools — IdeaHub, SkillsHub, and BirthdayHub — under a single Next.js 14 web app with PWA capability, shared authentication, and a consolidated activity feed.

GitHub: `gopal-c/Engage`

---

## 1. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router (TypeScript) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Neon Postgres (provisioned via Vercel Storage) |
| SQL | Raw SQL via `@neondatabase/serverless` — **NO ORM** |
| Auth | NextAuth v5, Google OAuth restricted to `@valueaddsofttech.com` |
| AI | Groq (Llama 3.3 70B) for any AI-powered features |
| Deployment | Vercel |
| Mobile | PWA (manifest + service worker), future Capacitor wrap |

---

## 2. Database Architecture

Single Neon Postgres instance with schema-per-project separation.

### Schemas

```
auth          — shared identity (users, sessions, roles)
ideahub       — anonymous idea-sharing platform (migrated from IdeaForge)
skillshub     — HR/employee management platform
birthdayhub   — birthday email automation
engage        — portal-level tables (activity feed, notifications, settings)
```

### Key Principles

- `auth.users` is the single source of truth for identity across all schemas.
- All other schemas reference `auth.users.id` via real SQL foreign keys.
- Each app's tables are fully namespaced (`skillshub.milestones`, `ideahub.ideas`, etc.).
- Default `search_path` for the app: `auth,engage,public`.
- Schema-qualified table names used in all queries for clarity.

### auth.users Table (already created)

```sql
CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'employee',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### engage.activity_feed Table

```sql
CREATE TABLE engage.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  source_app TEXT NOT NULL CHECK (source_app IN ('ideahub', 'skillshub', 'birthdayhub', 'engage')),
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_feed_user ON engage.activity_feed(user_id, created_at DESC);
CREATE INDEX idx_activity_feed_source ON engage.activity_feed(source_app, created_at DESC);
```

### engage.notifications Table

```sql
CREATE TABLE engage.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  source_app TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON engage.notifications(user_id, read, created_at DESC);
```

### engage.app_settings Table

```sql
CREATE TABLE engage.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  app TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, app)
);
```

---

## 3. Authentication

### Flow

1. User clicks "Sign in with Google" on `/login`.
2. NextAuth v5 handles OAuth flow via Google provider.
3. On callback, check email ends with `@valueaddsofttech.com` — reject otherwise.
4. Upsert into `auth.users` (insert on first login, update `name`/`avatar_url`/`updated_at` on subsequent logins).
5. JWT callback includes `user.id` and `user.role` in the token.
6. Session callback exposes `id` and `role` to the client.
7. All protected pages check session server-side, redirect to `/login` if absent.

### Roles

- `employee` — default, can access all apps, view own data
- `hr` — can access HR-specific features in SkillsHub, BirthdayHub admin
- `admin` — full access, manage users, portal settings

Role is stored in `auth.users.role` and included in the JWT. Role-based access is enforced at the API route level.

---

## 4. Project Structure

```
Engage/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx              # Google sign-in page
│   ├── dashboard/
│   │   └── page.tsx                  # Unified dashboard home
│   ├── apps/
│   │   ├── ideahub/
│   │   │   └── page.tsx              # IdeaHub embedded/linked view
│   │   ├── skillshub/
│   │   │   └── page.tsx              # SkillsHub embedded/linked view
│   │   └── birthdayhub/
│   │       └── page.tsx              # BirthdayHub embedded/linked view
│   ├── activity/
│   │   └── page.tsx                  # Full activity feed page
│   ├── profile/
│   │   └── page.tsx                  # User profile & settings
│   ├── admin/
│   │   ├── users/
│   │   │   └── page.tsx              # User management (admin only)
│   │   └── page.tsx                  # Admin dashboard
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts          # NextAuth handler
│   │   ├── activity/
│   │   │   └── route.ts              # GET activity feed, POST new event
│   │   ├── notifications/
│   │   │   └── route.ts              # GET/PATCH notifications
│   │   └── users/
│   │       └── route.ts              # User CRUD (admin)
│   └── layout.tsx                    # Root layout with sidebar nav
├── components/
│   ├── ui/                           # shadcn/ui components
│   ├── sidebar.tsx                   # App navigation sidebar
│   ├── app-card.tsx                  # Dashboard app card component
│   ├── activity-item.tsx             # Activity feed item
│   ├── notification-bell.tsx         # Notification indicator + dropdown
│   └── user-menu.tsx                 # Avatar + dropdown (profile, logout)
├── lib/
│   ├── db.ts                         # Neon serverless client + sql helper
│   ├── auth.ts                       # NextAuth v5 config
│   ├── auth-guard.ts                 # Server-side session check helper
│   └── activity.ts                   # Helper to log events to engage.activity_feed
├── db/
│   └── migrations/
│       ├── 001_auth_users.sql
│       ├── 002_engage_activity_feed.sql
│       ├── 003_engage_notifications.sql
│       └── 004_engage_app_settings.sql
├── public/
│   ├── manifest.json
│   ├── sw.js                         # Service worker
│   ├── icon-192.png
│   └── icon-512.png
├── .env.example
├── next.config.js
├── ENGAGE_SPEC.md
└── package.json
```

---

## 5. Core Pages & Components

### Dashboard (`/dashboard`)

- Welcome banner with user name and avatar
- **App cards** in a responsive grid (3 columns desktop, 1 mobile):
  - **IdeaHub** — show count of recent ideas, trending idea title
  - **SkillsHub** — show user's profile completion %, upcoming milestone
  - **BirthdayHub** — show next upcoming birthday, days until
- **Recent activity** section below cards — last 10 items from `engage.activity_feed`
- **Notification bell** in header — unread count badge, dropdown with recent notifications

### Sidebar Navigation

- Dashboard (home icon)
- IdeaHub
- SkillsHub
- BirthdayHub
- Activity Feed
- Profile
- Admin (visible only if role is `admin`)
- Collapsible on mobile (hamburger menu)

### Activity Feed (`/activity`)

- Full paginated feed from `engage.activity_feed`
- Filter by app (all / ideahub / skillshub / birthdayhub)
- Each item shows: app icon, title, description, relative timestamp
- Clicking an item navigates to the relevant app/page

---

## 6. lib/db.ts — Database Helper

```typescript
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL!);

export { sql };

// Usage: await sql`SELECT * FROM auth.users WHERE id = ${userId}`;
// Always use schema-qualified table names.
```

---

## 7. lib/activity.ts — Activity Logger

```typescript
import { sql } from './db';

export async function logActivity({
  userId,
  sourceApp,
  eventType,
  title,
  description,
  metadata,
}: {
  userId: string;
  sourceApp: 'ideahub' | 'skillshub' | 'birthdayhub' | 'engage';
  eventType: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}) {
  await sql`
    INSERT INTO engage.activity_feed (user_id, source_app, event_type, title, description, metadata)
    VALUES (${userId}, ${sourceApp}, ${eventType}, ${title}, ${description || null}, ${JSON.stringify(metadata || {})})
  `;
}
```

This helper will be called from API routes in each app when key events occur (idea submitted, profile updated, birthday email sent, etc.).

---

## 8. PWA Configuration

### public/manifest.json

```json
{
  "name": "Engage — ValueAdd SoftTech",
  "short_name": "Engage",
  "description": "Unified internal tools portal",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0f172a",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker (public/sw.js)

- Cache-first strategy for static assets (CSS, JS, icons)
- Network-first for API calls and pages
- Offline fallback page showing "You're offline — reconnect to continue"

### next.config.js PWA metadata

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [{ key: 'Content-Type', value: 'application/manifest+json' }],
      },
    ];
  },
};
```

Add `<link rel="manifest" href="/manifest.json">` and meta tags for theme color, apple-touch-icon in root layout `<head>`.

---

## 9. App Integration Strategy

Each of the three apps will be integrated in phases. The approach for each:

### Phase 1: Link-out (immediate)

- Dashboard cards link to the existing standalone Vercel deployments of each app.
- Activity feed populated manually or via API webhook from each app.
- Shared auth means SSO-like experience (same Google account, but technically separate sessions).

### Phase 2: Embedded (medium-term)

- Each app's core UI is rebuilt as pages within Engage under `/apps/ideahub`, `/apps/skillshub`, `/apps/birthdayhub`.
- Each app's data tables migrated into their respective schemas in the shared Neon DB.
- API routes for each app live within Engage's codebase.
- Activity logging is inline — no webhooks needed.
- Shared layout, navigation, and notification system.

### Phase 3: Deep integration (future)

- Cross-app features: "Employee of the Month" combining SkillsHub profile + IdeaHub contributions + BirthdayHub celebrations.
- Unified search across all apps.
- AI-powered insights dashboard (Groq) — summarize team activity, suggest ideas based on skills, etc.
- Push notifications via service worker for real-time updates.
- Capacitor wrap for native mobile app if needed.

---

## 10. Environment Variables

```env
# Database (auto-populated by Vercel Storage)
POSTGRES_URL=
POSTGRES_URL_NON_POOLING=

# Auth
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_SECRET=

# App URLs (for link-out phase)
IDEAHUB_URL=https://z-index-9999-idea-hub.vercel.app
SKILLSHUB_URL=https://z-index-9999-skills-hub.vercel.app
BIRTHDAYHUB_URL=https://z-index-9999-birthday-hub.vercel.app

# AI (future)
GROQ_API_KEY=

# App
NEXTAUTH_URL=https://z-index-9999-engage.vercel.app
```

---

## 11. Migration Files

All migrations live in `db/migrations/` and are run manually via `psql` or Vercel's query tab against the non-pooling URL.

Naming: `NNN_description.sql` (e.g., `001_auth_users.sql`).

Each migration is idempotent where possible (use `IF NOT EXISTS`).

---

## 12. Build Order

Sequential phases for Claude Code implementation:

### Phase 1: Foundation (current — already done)
1. ✅ Next.js 14 project scaffolded
2. ✅ NextAuth v5 Google OAuth working
3. ✅ `auth.users` table created and upsert on login working
4. ✅ Dashboard with placeholder app cards

### Phase 2: Portal Core
5. Create `engage.activity_feed`, `engage.notifications`, `engage.app_settings` tables (run migrations)
6. Build `lib/activity.ts` helper
7. Build `/api/activity` route — GET (paginated, filterable by app) and POST (log event)
8. Build `/api/notifications` route — GET (unread for current user), PATCH (mark as read)
9. Build sidebar navigation component (responsive, collapsible on mobile)
10. Build notification bell component (unread badge, dropdown)
11. Build user menu component (avatar, profile link, logout)
12. Update root layout with sidebar + header (notification bell + user menu)

### Phase 3: Dashboard Widgets
13. Build app card component with dynamic data props (count, latest item, link)
14. Wire IdeaHub card — for now, show static "Coming Soon" or link to external URL
15. Wire SkillsHub card — same approach
16. Wire BirthdayHub card — same approach
17. Build recent activity section on dashboard — fetch last 10 from `engage.activity_feed`
18. Add activity item component (app icon, title, timestamp, click-through)

### Phase 4: Profile & Admin
19. Build `/profile` page — show user info from `auth.users`, allow name/avatar edit
20. Build `/admin/users` page — list all users, change roles (admin only)
21. Add role-based route protection (middleware or per-route guard)

### Phase 5: PWA
22. Create PWA manifest, icons
23. Create service worker with cache strategies
24. Add install prompt component
25. Add offline fallback page
26. Test installability on mobile

### Phase 6: App Migration (per-app, repeatable)
27. Migrate IdeaHub schema + data into `ideahub.*` tables in shared DB
28. Rebuild IdeaHub UI as pages under `/apps/ideahub`
29. Wire IdeaHub events into `engage.activity_feed`
30. Repeat for SkillsHub (migrate → rebuild → wire activity)
31. Repeat for BirthdayHub (migrate → rebuild → wire activity)

### Phase 7: Deep Integration (future)
32. Unified search across schemas
33. Cross-app insights dashboard (Groq)
34. Push notifications
35. Capacitor wrap for native mobile

---

## 13. Claude Code Usage Notes

- Each phase above should be given to Claude Code as a focused instruction.
- Reference this spec by phase number: "Implement Phase 2, steps 5-8 from ENGAGE_SPEC.md".
- All SQL must be raw — no Prisma, no Drizzle, no Knex.
- All table references must be schema-qualified (`auth.users`, not just `users`).
- Use `@neondatabase/serverless` with `POSTGRES_URL` (pooled).
- Use `POSTGRES_URL_NON_POOLING` only for DDL/migrations.
- shadcn/ui components should be added via `npx shadcn-ui@latest add <component>` as needed.
- Tailwind classes only — no custom CSS files unless absolutely necessary.
