# DeckGala MyClub (`@deckgala/myclub`) — Site Architecture & Technical Design Specification

**Document Version:** 1.0.0  
**Target Application:** `apps/myclub`  
**Package Name:** `@deckgala/myclub`  
**Monorepo:** `deckgala` (Bun workspaces)  
**Primary Framework:** Next.js 15+ (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma ORM, Better Auth, Stripe  
**Design Reference:** `deckgala_brand_guidelines.md` & `@deckgala/controls`  

---

## 1. Executive Summary & Product Vision

### 1.1 Purpose & Mission
**DeckGala MyClub** is the unified cloud management portal and competitive operating system for aquatic clubs. While `apps/app` handles low-latency, offline poolside race timing and `apps/results` delivers public spectator heat streams, **MyClub** provides swimming club administrators, head coaches, timekeepers, and parents with an intuitive, high-performance web dashboard to run daily club operations and competitions.

### 1.2 Core Capabilities
1. **Multi-Tenant Club Workspaces**: Single-deployment, shared-database SaaS platform supporting multiple club memberships per user with role-based data isolation.
2. **Roster & Member CRM**: Complete membership database tracking governing body registration numbers (Swim England / USA Swimming), emergency contacts, squad allocations, and renewal dates.
3. **Swimmer Profiles & Personal Bests (PBs)**: Automated tracking of lifetime personal bests across strokes, distances, and pool courses (25m short course, 50m long course, 25yd short course yards).
4. **Gala & Meet Operations**: Full meet creation, event scheduling, entry collection, automatic heat/lane seeding (cyclic, circle, and spearhead), and live heat sheet generation.
5. **Results Ingestion & Adjudication**: Cloud ingestion of poolside deck timing sessions (`apps/app`), split-second precision split reviews, DQ infraction logging, and official results publication to `apps/results`.
6. **Industry Standard Exports**: One-click generation of Hy-Tek Meet Manager (`.hy3`) files, entry sheets, CSV rosters, and printable poolside heat sheets.
7. **Monetization & Quota Management**: Integrated Stripe billing for multi-club administrators with dynamic allowance limits.

### 1.3 Target Personas & RBAC Hierarchy
| Role | Capabilities | Primary Views |
| :--- | :--- | :--- |
| **Club Admin** (`ADMIN`) | Full administrative governance over the club: invite/manage staff, club settings, branding, billing, member renewals, gala creation, and results publishing. | All club views, `/settings/*`, `/billing` |
| **Coach** (`COACH`) | Swimmer roster management, squad assignments, meet creation, event scheduling, swimmer entry seeding, and results adjudication. | `/roster`, `/swimmers`, `/galas`, `/results`, `/squads` |
| **Timekeeper / Official** (`TIMEKEEPER`) | Read-only roster view, access to meet schedules, heat sheets, and race adjudication/split verification. | `/galas`, `/galas/[id]/heats`, `/results` |
| **Parent / Swimmer** (`PARENT`) | Self-service portal scoped strictly to linked swimmer profiles, viewing upcoming meets, race entries, and personal best progressions. | `/my-swimmers`, `/galas` (public meets only) |
| **Platform Superadmin** (`PLATFORM_ADMIN`) | Global system operators authorized via `PLATFORM_ADMIN_EMAILS` env to adjust platform allowances, reassign unassigned legacy clubs, and monitor tenants. | `/platform` |

---

## 2. Technical Stack & Architecture

### 2.1 Framework & Core Dependencies
* **Framework:** Next.js 15+ with App Router (`apps/myclub/src/app`)
* **React Engine:** React 19 (Server Components by default; client components strictly for interactive state)
* **Type System:** TypeScript 5.8+ with strict type checking (`tsconfig.json`)
* **Styling & Tokens:** Tailwind CSS v4 consuming `@deckgala/controls` CSS design tokens (`@import "@deckgala/controls/tokens.css";`)
* **Database & ORM:** PostgreSQL accessed via Prisma Client (`@deckgala/database`)
* **Authentication:** Better Auth (`better-auth`) supporting email/password and optional OAuth (Google, Apple)
* **Payments & Billing:** Stripe Node SDK (`stripe`) with Stripe Checkout and Customer Portal integration
* **Validation:** Zod schemas shared across Server Actions and form controls (`@deckgala/api-types` & `zod`)

### 2.2 Monorepo Package Dependencies
```text
@deckgala/myclub
├── @deckgala/database      (Prisma client, data models, schema migrations)
├── @deckgala/controls      (Design tokens, LaneCard, StopButton, TimerDisplay, Tailwind variables)
└── @deckgala/api-types     (Shared Zod schemas, sync contracts, type definitions)
```

### 2.3 Tenancy & Session Isolation Model
1. **Club Scoping via Cookies:** Active club is determined by the `deckgala_active_club` cookie, verified against user's active `ClubMembership` record via `getAccessibleUserClubs(userId)`.
2. **Hard Database Filtering:** Every database mutation and query MUST include the active `clubId` in `where` conditions. Under no circumstances should cross-tenant data leak.
3. **Parent Scoping Rule:** For users with role `PARENT`, queries must filter swimmer and member records to `{ userId: session.user.id }` or linked swimmer associations.
4. **Subscription Locking:** If a user owns more administrator clubs than their allowed free quota (`PlatformSetting.freeClubLimit` or default 1) and does not hold an active Stripe subscription, clubs beyond the free threshold are rendered in a locked read-only / paywall state.

---

## 3. Information Architecture & Route Directory Map

### 3.1 App Directory File Structure
```text
apps/myclub/src/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   │   └── page.tsx                 # Better Auth login screen
│   │   ├── sign-up/
│   │   │   └── page.tsx                 # Account registration
│   │   └── invite/
│   │       └── [token]/
│   │           └── page.tsx             # 7-day single-use invitation acceptor
│   ├── (dashboard)/
│   │   ├── layout.tsx                   # App shell (Nav, ClubSwitcher, UserProfile, Tenancy Check)
│   │   ├── page.tsx                     # Club Overview & Operations Dashboard
│   │   ├── roster/
│   │   │   ├── page.tsx                 # Member & Swimmer Master Directory
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx             # Swimmer Profile & PB Progression View
│   │   │   └── import/
│   │   │       └── page.tsx             # CSV Roster Import / Export Tool
│   │   ├── squads/
│   │   │   └── page.tsx                 # Training Squads & Group Management
│   │   ├── galas/
│   │   │   ├── page.tsx                 # Meets list (Upcoming, Active, Completed)
│   │   │   ├── new/
│   │   │   │   └── page.tsx             # Gala Creation Wizard
│   │   │   └── [id]/
│   │   │       ├── layout.tsx           # Gala Sub-navigation (Overview, Events, Entries, Heats, Results)
│   │   │       ├── page.tsx             # Gala Overview & Event Schedule
│   │   │       ├── edit/
│   │   │       │   └── page.tsx         # Gala Meet & Event Schedule Editor
│   │   │       ├── entries/
│   │   │       │   └── page.tsx         # Swimmer Entry Manager & Seeding Setup
│   │   │       ├── heats/
│   │   │       │   └── page.tsx         # Heat & Lane Seeding Visualizer / Heat Sheets
│   │   │       ├── results/
│   │   │       │   └── page.tsx         # Ingested Race Results, Splits & Adjudication
│   │   │       └── export/
│   │   │           └── page.tsx         # Hy-Tek .hy3 & PDF Export Center
│   │   ├── settings/
│   │   │   ├── layout.tsx               # Settings sub-layout
│   │   │   ├── club/
│   │   │   │   └── page.tsx             # Club Profile, Course Defaults, Branding
│   │   │   └── team/
│   │   │       └── page.tsx             # Staff Directory & Invitation Generator
│   │   └── billing/
│   │       └── page.tsx                 # Stripe Subscription & Extra Club Add-ons
│   ├── platform/
│   │   └── page.tsx                     # Superadmin controls (legacy club assignment, quotas)
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...all]/route.ts        # Better Auth catch-all endpoint
│   │   ├── stripe/
│   │   │   └── webhook/route.ts         # Stripe lifecycle webhooks
│   │   └── export/
│   │       └── hytek/[galaId]/route.ts  # Dynamic .hy3 file generator route
│   ├── actions/                         # Server Actions grouped by domain
│   │   ├── club.ts                      # Club creation, switching, settings
│   │   ├── member.ts                    # Member CRUD, renewals, emergency contacts
│   │   ├── swimmer.ts                   # Swimmer PBs, squad assignment
│   │   ├── gala.ts                      # Meet creation, event builder, visibility toggle
│   │   ├── seeding.ts                   # Seeding algorithms, heat lane assignments
│   │   ├── results.ts                   # Results adjudication, DQ infractions, manual overrides
│   │   └── invites.ts                   # Staff invitation links & acceptance
│   ├── components/                      # Modular UI components
│   │   ├── shell/                       # Nav, Topbar, ClubSwitcher, UserMenu
│   │   ├── roster/                      # MemberTable, RenewalPill, SwimmerDrawer, AddMemberModal
│   │   ├── galas/                       # MeetCard, EventRow, SeedingGrid, HeatSheetView
│   │   ├── results/                     # SplitTable, DQBadge, TimeEditorModal
│   │   └── ui/                          # Button, Input, Select, Modal, Badge, Dropdown
│   ├── lib/
│   │   ├── auth.ts                      # Server-side Better Auth setup
│   │   ├── auth-client.ts               # Client-side Better Auth client
│   │   ├── club-context.ts              # Active club session resolver
│   │   ├── seeding-engine.ts            # Seeding algorithms (cyclic, spearhead)
│   │   ├── hytek-exporter.ts            # .hy3 format serialization logic
│   │   ├── plan-policy.ts               # Stripe subscription allowance math
│   │   └── session.ts                   # Session and platform admin guards
│   ├── globals.css                      # Global Tailwind & design token overrides
│   └── layout.tsx                       # Root HTML shell
```

---

## 4. Page-by-Page Detailed Feature Specifications

### 4.1 Global App Shell & Navigation
* **Top Bar (`<AppHeader />`):**
  * **Brand Mark:** DeckGala duo-tone SVG logo with "MyClub" portal subtitle.
  * **Club Switcher (`<ClubSwitcher />`):** Dropdown allowing users to switch between their authorized clubs. Displays user role pill next to each club name (`ADMIN`, `COACH`, etc.). Triggers action setting `deckgala_active_club` cookie and revalidates path.
  * **Global Alert Banners:**
    * *Subscription Delinquent / Limit Reached:* Displays amber warning banner linking to `/billing`.
    * *Expiring Memberships:* Badged notification if $\ge 1$ memberships expire within 30 days.
  * **User Profile & Navigation:** Current user email/avatar, quick link to `/settings/club`, `/billing`, and `<SignOutButton />`.
* **Sidebar / Main Navigation (`<AppNav />`):**
  * `Dashboard` (`/`) — High-level club KPIs and activity stream.
  * `Roster & Swimmers` (`/roster`) — Swimmer and member management.
  * `Squads` (`/squads`) — Training squad rosters.
  * `Gala Meets` (`/galas`) — Competition scheduling, heat sheets, and results.
  * `Club Settings` (`/settings/club`) — Staff access, branding, and billing (Admins only).

---

### 4.2 Dashboard & Club Overview (`/`)
* **KPI Metrics Bar:**
  1. **Registered Swimmers:** Total active roster count.
  2. **Renewals Due:** Count of members expired or expiring within 30 days.
  3. **Upcoming Galas:** Next scheduled competition countdown.
  4. **Active Squads:** Total training groups configured.
* **Urgent Attention Section:**
  * Displays members with overdue renewals with one-click inline "Renew 1 Year" action buttons.
  * Displays pending deck sessions uploaded from pool phones that need coach review.
* **Upcoming Meets Panel:**
  * Cards showing next 3 scheduled meets with course badge (`25m`, `50m`, `SCY`), entry count, and quick links to edit events or view heat sheets.

---

### 4.3 Swimmer & Roster System (`/roster`, `/swimmers/[id]`, `/my-swimmers`)

The Swimmer domain is the central competitive heart of MyClub. It serves three distinct user perspectives with role-based scoping:
* **Coaches & Administrators:** Full club roster view, squad transfers, manual PB adjustments, official qualifying cut auditing, and gala entry approvals.
* **The Swimmer:** Direct profile view of their own performance trajectory, PB badges, cut-time achievements, and gala entries.
* **Parents:** Dedicated family view (`/my-swimmers`) managing all linked children/swimmers under one parent account with entry bookings and dues tracking.

#### 4.3.1 Swimmer Profile Page Architecture (`/swimmers/[id]`)
The swimmer profile is designed with a responsive poolside layout adhering to DeckGala dark-mode ergonomic standards:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ SWIMMER HEADER: Alex Morgan (Age 13 · DOB: 14/05/2013)                 [Edit Profile]  │
│ Squad: Senior Performance · Swim England: 1482931 · Course Preference: 25m SC          │
│ 🏆 County Qualified (5 Events)  |  🥈 Regional Qualified (2 Events)  |  🥇 National (1) │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TABS: [ Personal Bests & Standards ]   [ Race History ]   [ Gala Bookings & Meets ]     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TAB 1: PERSONAL BESTS MATRIX & QUALIFYING CUTS                                         │
│ Course Filter: [ 25m Short Course (Active) ] [ 50m Long Course ] [ SCY ]               │
│                                                                                        │
│ Stroke       50m         100m         200m         400m        800m        1500m       │
│ Freestyle    28.14 (PB)  1:01.42 (PB) 2:14.20 (PB) 4:42.10(PB)  —           —          │
│              [County ✓]  [Reg: -0.3s] [County ✓]   [Within 1s]                         │
│ Backstroke   32.40 (PB)  1:10.12 (PB) 2:31.50 (PB)   —          —           —          │
│              [Reg ✓]     [County ✓]   [Reg ✓]                                          │
│ Breaststroke 36.80 (PB)  1:19.45 (PB) 2:52.10 (PB)   —          —           —          │
│ Butterfly    30.15 (PB)  1:08.50 (PB)   —            —          —           —          │
│ Ind. Medley    —         1:11.20 (PB) 2:34.10 (PB) 5:25.80(PB)  —           —          │
│                                                                                        │
│ * Click any cell to inspect split history, progression curve, or adjust benchmark.    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TAB 2: RACE HISTORY & SPLIT LEDGER                                                     │
│ [Search Meet/Stroke...]                                     Filter by Season: [2026/27]│
│ Date       Meet                      Event        Time        Split Pacing  Status     │
│ 14/10/2026 Autumn Regional Sprint    100m Free    1:01.42 PB  29.10 / 32.32 OFFICIAL   │
│ 02/09/2026 Club Time Trials          50m Fly        30.15 PB  —             OFFICIAL   │
│ 15/07/2026 Summer County Champs      200m Free    2:14.20 PB  30.4/34.1/... OFFICIAL   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ TAB 3: GALA BOOKINGS & ATTENDANCE                                                      │
│ ── PAST ATTENDED GALAS ─────────────────────────────────────────────────────────────── │
│ • Autumn Regional Sprint (14 Oct 2026) · 3 Events swum · 2 PBs set                     │
│ • Summer County Champs (15 Jul 2026) · 4 Events swum · 1 Gold, 1 Silver                │
│                                                                                        │
│ ── FUTURE BOOKED GALAS ─────────────────────────────────────────────────────────────── │
│ • Winter County Qualifier (18 Dec 2026 · 25m Short Course)           [Status: Confirmed]│
│   - Event 101: Boys 13-14 100m Freestyle (Seed: 1:01.42)                               │
│   - Event 105: Boys 13-14 50m Butterfly  (Seed: 30.15)                                 │
│ • National Junior Cup (22 Jan 2027 · 50m Long Course)                [Status: Pending]  │
│   - Event 204: Boys 13-14 200m Backstroke (Seed: 2:35.80)                              │
│                                              [ + Book / Enter New Gala Event ]         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### 4.3.2 Date of Birth (DOB) & Age Bracket Computation
1. **Accurate Benchmark Matching:** Swim competition categories depend strictly on age. The system computes age using two official swim governing body rules:
   * **Age as of 31st December (`AGE_DEC_31`):** Default for Swim England, British Swimming, and LEN European competitions (calculated as `galaYear - birthYear`).
   * **Age on the Day (`AGE_DAY_OF_MEET`):** Standard for invitational meets and USA Swimming (difference between meet start date and birth date).
2. **Dynamic Age Standard Selector:**
   * When rendering PB comparisons or meet entry forms, the system uses the swimmer's `dateOfBirth` to evaluate their target age group (e.g. 9 yrs, 10 yrs, 11 yrs, 12 yrs, 13 yrs, 14 yrs, 15 yrs, 16 yrs, 17+ / Open).

#### 4.3.3 Visual Personal Bests (PB) Engine & Split Inspector
1. **Lifetime PB vs Season Best:**
   * **Lifetime PB:** The all-time fastest verified electronic or manual time achieved by the swimmer for a specific distance, stroke, and course. Highlighted with an Electric Cyan/Gold `#00E5FF` badge and tabular mono numerals (`JetBrains Mono`).
   * **Season Best (SB):** The fastest time achieved within the current competition season (September 1 - August 31).
2. **Cell Interactive Modal / Drawer:**
   * Tapping/clicking any stroke/distance cell opens a slide-over drawer displaying:
     * Full historic progression of times for that event over time.
     * Intermediate 50m/100m split breakdowns recorded by poolside touchpads or the `@deckgala/app` mobile timer.
     * Meet venue, pool course (25m vs 50m), and official certification link.
     * Manual PB Override (restricted to `ADMIN` and `COACH` roles with audit note).

#### 4.3.4 County, Regional & National Qualifying Times Engine
1. **Time Standards Data Model (`QualifyingStandard`):**
   * Stores benchmark cut times by:
     * Governing Body / Region (e.g., Swim England County, Regional, National, USA Swimming B/BB/A/AA/AAA/AAAA).
     * Stroke, Distance, Course (25m / 50m / SCY).
     * Gender (`FEMALE`, `MALE`, `OPEN`).
     * Age Group (e.g., 10, 11, 12, 13, 14, 15, 16, 17+).
     * Cut Level: `COUNTY`, `REGIONAL`, `NATIONAL`.
2. **Visual Status Badges on the Profile:**
   * 🟢 **Achieved (Green `#00E676`):** Swimmer PB is equal to or faster than the standard cut time. Displays `[County ✓]` or `[Regional ✓]`.
   * 🟡 **Within Reach (Amber `#FFB300` / Cyan `#00E5FF`):** Swimmer is within 1.5% or < 1.00s of the cut. Displays delta: `[County: -0.42s]`.
   * ⚪ **Target (Muted Deck `#8CA0BA`):** Standard cut time displayed as a future target goal.
3. **Swimmer Achievement Summary Header:**
   * Prominently highlights the swimmer's championship status: e.g. "County Qualifier (6 Events)", "Regional Consideration (2 Events)", "National Qualifier (1 Event)".

#### 4.3.5 Gala Attendance & Future Booking Tracker
1. **Past Gala Attendance Ledger:**
   * Automatically aggregates all completed `RaceResult` records for the swimmer grouped by `Gala`.
   * Summarizes meet achievements: total events entered, medals/places achieved, new PBs minted during that meet.
2. **Upcoming Gala Bookings & Entries:**
   * Tracks future meets where the swimmer is registered or entered.
   * Displays entry status:
     * `SUBMITTED`: Entry registered by parent/coach; awaiting meet host seeding.
     * `CONFIRMED`: Swimmer seeded into heat and lane.
     * `WITHDRAWN`: Scratched before deadline.
   * Direct "Enter Future Gala" flow enabling coaches or authorized parents to select open events and auto-populate seed times from the swimmer's current PB record.

#### 4.3.6 Parent Multi-Swimmer Family Portal (`/my-swimmers`)
* Designed specifically for users signed in with the `PARENT` role:
  * Shows a card for each child/swimmer linked to their family account.
  * Quick summary per child: Squad, next upcoming booked meet, recent PBs set.
  * Direct action to pay membership dues or book future meet entries.

#### 4.3.7 Swim England Membership API Integration (`api-membership.swimming.org`)
To eliminate manual data entry errors and ensure competitive integrity, MyClub integrates directly with the official **Swim England Membership API** (`https://api-membership.swimming.org/docs`).

1. **Governing Body Data Ingestion & Verification:**
   * Once a swimmer is registered with their Swim England Number (`governingBodyId`), the system queries the API to pull and synchronize:
     * **Official Name & Spelling:** Registered legal name matching British Rankings.
     * **Verified Date of Birth (DOB):** Authoritative birth date from the national registry, ensuring 100% accurate competition age calculations and preventing age-group disqualifications.
     * **Gender / Competition Category:** Official registered gender (`FEMALE`, `MALE`, `OPEN`).
     * **Membership Category & Status:** Identifies category tier (e.g., *Category 1: Club Train*, *Category 2: Club Compete*, *Category 3: Club Support*) and active validity status (`ACTIVE`, `LAPSED`, `EXPIRED`).
     * **Official Rankings Times:** Automated import of certified times from licensed Level 1-4 meets.
   * **Verification Badge:** Swimmers with verified data display a cyan badge: `[✓ Swim England Verified]` with a timestamp of the last successful sync.

2. **Three-Tier Refresh Hierarchy:**
   The sync engine supports granular execution across three operational scopes:
   * **Tier 1: Individual Swimmer Level (`/swimmers/[id]`):**
     * Single-click **"Sync with Swim England"** action button in the swimmer profile header.
     * Instantly refreshes personal details, membership validity, and ranking times for that specific swimmer.
     * Highlights discrepancies (e.g. if a parent entered an incorrect DOB) and prompts coach/admin for one-click alignment with national records.
   * **Tier 2: Squad Level (`/squads/[id]`):**
     * **"Sync Squad with Swim England"** button on the squad dashboard for head and assistant coaches.
     * Sequentially syncs all active members of the squad in a batch operation.
     * Returns a summary report: e.g., *"24 Swimmers Synced · 2 Membership Renewals Updated · 4 Swimmers Missing Category 2 Competition Licences"*.
   * **Tier 3: Club-Wide Level (`/roster`, `/settings/club`):**
     * **"Run Full Club Membership Sync"** triggered on-demand by Club Administrators or running on an automated monthly cron.
     * Processes all club members with a rate-limited queue conforming to Swim England API throughput guidelines.
     * Generates a **Compliance Audit Dashboard**:
       * Flags unlicenced swimmers who cannot legally enter upcoming licensed galas.
       * Flags members whose Swim England annual registration is approaching expiry or lapsed.

3. **Secure API Architecture & Mock Gateway:**
   * Handled by `lib/swim-england-api.ts` on the server side using the club's Swim England API token / certificate.
   * Includes an offline-tolerant fallback and development mock provider to enable fast UI testing without live Swim England production credentials.

#### 4.3.8 Member & Swimmer Profile Editing (Admins & Coaches)
Coaches and Club Administrators have authorized permissions to edit member and swimmer details directly via `/swimmers/[id]#edit-member` and the `/roster` directory:
* **Contact Details:** Update member primary email address and telephone number.
* **Governing Body Registration:** Update or correct Swim England ID (`governingBodyId`) for race license verification and rankings sync.
* **Biographical & Category Data:** Update legal first name, last name, Date of Birth (DOB), competition gender (`FEMALE`, `MALE`, `OPEN`, `OTHER`), and assigned training Squad.
* **Emergency Welfare Details:** Update emergency contact person name and emergency telephone number.
* **Transaction Synchrony:** Executed via `updateMember(formData)` in an atomic database transaction ensuring `Member` and linked `Swimmer` records remain 100% synchronized, revalidating `/roster`, `/swimmers/[id]`, and the dashboard.

#### 4.3.9 Gala Program Builder & Default Events Populator
In both the Gala Detail view (`/galas/[id]`) and Gala Editor (`/galas/[id]/edit`), coaches and admins can rapidly build out race programs:
* **Pool Size-Aware "Add All Default Events" Button:** One-click generation of standard competitive programs based on pool course:
  * **25m Short Course (`SHORT_COURSE_METERS`):** 36 events (18 Girls + 18 Boys: 50/100/200/400/800/1500m Free, 50/100/200m Back/Breast/Fly, 100/200/400m IM).
  * **50m Long Course (`LONG_COURSE_METERS`):** 34 events (17 Girls + 17 Boys: excludes 100m IM which cannot be contested in a 50m pool).
  * **25y Short Course Yards (`SHORT_COURSE_YARDS`):** 36 events with yard-unit distance formatting.
  * **Conflict-Free Population:** Preserves existing events and calculates non-colliding `eventNumber` sequence.
* **Flexible Program Reordering:**
  * **Instant Move Up (▲) / Move Down (▼):** Safe atomic swap of event numbers using temporary sequence keys to prevent `@@unique([galaId, eventNumber])` collisions.
  * **Sequential Renumbering (`renumberGalaEvents`):** Normalizes all events into neat sequential numbers 1..N.
  * **Collision-Safe Manual Edits:** Modifying `eventNumber` in the editor swaps with the conflicting event rather than throwing duplicate key errors.

---

### 4.4 Gala & Competition Management (`/galas`, `/galas/[id]`, `/galas/[id]/enter`)

The Gala Management module handles the complete competition lifecycle from venue mapping and session building to parent entry requests, pricing calculations, and seeding.

#### 4.4.1 Venue Management & OpenStreetMap Integration
Swimming meets are typically hosted at a recurring set of regional aquatic centres (e.g. municipal 25m/50m pools). 
1. **Club Venue Directory (`Venue`):**
   * Reusable venue repository attached to the club.
   * Fields: `name`, `addressLine1`, `addressLine2`, `city`, `postcode`, `country`, `latitude`, `longitude`, `parkingNotes`.
   * When creating or editing a gala, administrators can select from a dropdown of previously used venues or add a new venue that is automatically saved for future meets.
2. **OpenStreetMap Interactive Display (`<VenueMap />`):**
   * Embedded OpenStreetMap card on the Gala Overview and Parent Entry pages.
   * Displays pool marker, physical address, driving directions link, and spectator parking details.
   * Zero external API key dependencies (using standard Leaflet / OpenStreetMap tile layers with high-contrast dark-mode styling compliant with DeckGala brand guidelines).

#### 4.4.2 Gala Sessions & Program Structure
Competitions are organized hierarchically: **Gala $\to$ Sessions $\to$ Events**.
1. **Gala Sessions (`GalaSession`):**
   * Divides a 1-day or multi-day meet into distinct sessions (e.g., *Session 1: Saturday Morning Warm-up 08:00 / Start 09:00*, *Session 2: Saturday Afternoon*, *Session 3: Sunday Morning*).
   * Displays warmup start time, session start time, and estimated finish.
2. **Session Event Organization (`Event`):**
   * Each event is bound to a session and displays:
     * **Session & Event Identification:** Session number + session event number (e.g., *Session 1, Event 3*) and overall program number (*Event 103*).
     * **Gender Designation:** Prominently tagged as `M` (Male), `F` (Female), or `Open` (Open / Mixed).
     * **Race Parameters:** Distance (50m, 100m, 200m, 400m, 800m, 1500m), Stroke (`FREESTYLE`, `BACKSTROKE`, `BREASTSTROKE`, `BUTTERFLY`, `INDIVIDUAL_MEDLEY`), Course (`25m SC`, `50m LC`, `SCY`).
     * **Eligible Age Groups:** Specific age ranges (e.g. `9-10`, `11-12`, `13-14`, `15 & Over`, `Open`) based on the meet's age calculation rule (`AGE_DEC_31` or `AGE_DAY_OF_MEET`).
     * **Qualifying & Cutoff Times:**
       * *Qualifying Time (Upper Cut):* Swimmer must be equal to or faster than this time to be eligible.
       * *Consideration / "No Faster Than" Cutoff (Lower Cut):* For development/graded meets (e.g. B/C grade galas), swimmers faster than this cutoff are excluded to keep competition fair.
       * *Allow No-Time (`allowNoTime`):* Flag indicating whether swimmers without an official PB can enter.

#### 4.4.3 Gala & Event Pricing Engine
Meets require flexible fee structures to cover pool hire, electronic timing badges, and governing body levy fees:
1. **Gala Base Registration Fee (`entryFeePence`):**
   * Flat entrance fee charged per swimmer entering the meet (e.g., £5.00 meet administration/facility fee).
2. **Event Pricing Hierarchy:**
   * **Gala Default Event Price (`defaultEventFeePence`):** Baseline price per individual race entry (e.g., £7.50 per event).
   * **Individual Event Override (`Event.feePence`):** Optional override on specific events (e.g., 800m & 1500m distance races or relays priced at £10.00 instead of £7.50).

#### 4.4.4 Parent Multi-Child Discovery & Smart Qualification Filtering
Parents accessing `/galas` and `/galas/[id]/enter` benefit from an automated qualification assistant:
1. **Multi-Child Eligibility Engine:**
   * One parent account frequently manages multiple competitive swimmers (e.g., sibling A aged 11 and sibling B aged 14).
   * The system automatically scans each child against the gala program:
     * Validates gender match (`M` / `F` / `Open`).
     * Calculates child's age under the meet's specific age rule.
     * Compares the child's active PB against the event's qualifying standard and cutoff times.
2. **Smart Qualification Status Pills:**
   * 🟢 **Qualified:** Child's PB meets the required standard.
   * 🟡 **Consideration / NT:** Eligible under consideration or No-Time allowance.
   * 🔴 **Not Qualified:** Swimmer's PB is too slow, or faster than a developmental meet's "No Faster Than" limit.
3. **Filter Controls:**
   * **"Show Only Eligible Events" (Default ON):** Automatically hides races the selected child cannot enter, preventing entry errors and parent confusion.
   * Toggle to "Show All Events" displaying grayed-out non-eligible races with an explanatory tooltip (e.g. *"Requires 100m Free under 1:12.00 (Current PB: 1:14.20)"*).

#### 4.4.5 Parent Multi-Child Entry Wizard & Checkout Flow (`/galas/[id]/enter`)
A streamlined 4-step wizard for family entries:
```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ GALA ENTRY: 2026 Winter County Qualifier (18 Dec 2026 · Ponds Forge)                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ STEP 1: SELECT SWIMMERS                                                                 │
│ [✓] Alex Morgan (Boy, Age 13)         [✓] Mia Morgan (Girl, Age 11)                    │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ STEP 2: EVENT SELECTION                                                                 │
│ ── Alex Morgan (Boy, Age 13) ───────────────────────────────────────────────────────── │
│   [✓] Session 1, Ev 101: Boys 13-14 100m Free (Seed: 1:01.42 PB)               £7.50  │
│   [✓] Session 1, Ev 105: Boys 13-14 50m Fly   (Seed: 30.15 PB)                 £7.50  │
│   [ ] Session 2, Ev 203: Boys 13-14 200m Back (Seed: 2:31.50 PB)               £7.50  │
│                                                                                         │
│ ── Mia Morgan (Girl, Age 11) ───────────────────────────────────────────────────────── │
│   [✓] Session 1, Ev 102: Girls 11-12 100m Free (Seed: 1:09.80 PB)              £7.50  │
│   [✓] Session 2, Ev 206: Girls 11-12 200m IM   (Seed: 2:54.10 PB)              £7.50  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ STEP 3: COST BREAKDOWN & SUMMARY                                                        │
│ • Alex Morgan: Gala Base Fee (£5.00) + 2 Events (£15.00) =                     £20.00  │
│ • Mia Morgan:  Gala Base Fee (£5.00) + 2 Events (£15.00) =                     £20.00  │
│ ─────────────────────────────────────────────────────────────────────────────────────── │
│ TOTAL DUE:                                                                     £40.00  │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ STEP 4: PAYMENT CONFIRMATION                                                            │
│ ℹ️ Payment Processing Mode:                                                            │
│ [ (•) Pay Online (Card / Stripe) ]    [ ( ) Pay at Pool / Club Dues Account ]           │
│                                                                                         │
│ [ Skip Payment for Now / Submit Entry Request ]             [ Complete & Submit Entry ] │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```
1. **Entry Submission & Storage (`GalaEntry` & `EventEntry`):**
   * Creates a parent `GalaEntry` record for each swimmer linking to selected `EventEntry` rows with seed times locked from active PBs.
   * Status tracks: `SUBMITTED`, `CONFIRMED`, `PENDING_PAYMENT`, `PAID`, or `WITHDRAWN`.
   * Flexible Payment Prompt: Supports card checkout via Stripe, direct pool payment ("Pay at Pool / Invoice to Dues"), or "Skip for Now" during development/testing.

#### 4.4.6 Seeding Engine & Heat Sheet Generation (`/galas/[id]/heats`)
* **Standard Spearhead Seeding (Timed Finals):**
  * Heats sorted from slowest to fastest seed times.
  * Within each heat, swimmers assigned from center lanes outwards (e.g. in 8-lane pool: Lanes 4, 5, 3, 6, 2, 7, 1, 8).
* **Circle / Cyclic Seeding (Championship Prelims):**
  * Top seeds distributed across the final 2 or 3 heats to ensure balanced heats.
* **Printable Poolside Heat Sheets:**
  * Clean, high-contrast tabular sheets printable to clipboard PDF for poolside marshals, referees, and timekeepers.

---

### 4.5 Race Results & Deck Sync Adjudication (`/galas/[id]/results`)
* **Deck Session Ingestion:**
  * When mobile pool phones (`apps/app`) run timing for a meet, the session syncs via `@deckgala/api` into `DeckSession` and `RaceResult` records.
  * Results view surfaces synced runs marked as `UNOFFICIAL`.
* **Adjudication Workspace:**
  * Filter by Event and Heat.
  * Lane-by-lane breakdown displaying:
    * Lane number, swimmer name.
    * Recorded finish time (in `MM:SS.ss.xx`).
    * Intermediate split times (e.g., 50m split, 100m split).
    * Status: `OFFICIAL`, `UNOFFICIAL`, `DISQUALIFIED`, `DID_NOT_FINISH`, `DID_NOT_START`.
    * DQ Infraction Code selector (e.g. "DQ 4.4 False Start", "DQ 7.6 Did not touch with both hands simultaneously at turn").
  * **Adjudication Actions:**
    * Single-click "Approve Heat as Official".
    * Manual Time Correction modal with audit trail notes.
    * "Publish Heat Results" to instantly update the public spectator view in `apps/results`.

---

### 4.6 Squad Management & Performance Intelligence (`/squads`, `/squads/[id]`, `/squads/[id]/performance`)

The Squads module empowers coaching staff to manage training groups, execute scheduled roster promotions over time, and analyze aggregate squad performance to optimize coaching focus.

#### 4.6.1 Squad Definitions & Timetable CRUD
1. **Squad Entity (`Squad`):**
   * Attributes: `name` (e.g. "Junior Development", "County Performance", "National Elite"), `code`, `colorHex` (DeckGala palette or custom brand color), `description`, `minAge`, `maxAge`.
   * **Assigned Coaching Staff:** Multi-coach assignment linking to `User`/`Member` records with role designations (Head Coach, Lead Assistant Coach).
   * **Weekly Training Timetable:** Pool session schedule (Day of week, start time, end time, venue pool, lane count).

#### 4.6.2 Temporal Squad Membership & Scheduled Promotions
Swimming clubs operate on seasonal promotion cycles where swimmers move up to higher squads at fixed dates (e.g. *"Starting May 1st, swimmers transition to Summer Squads"* or *"September 1st seasonal promotions"*).
1. **Effective-Dated Membership (`SquadMembership`):**
   * Schema: `id`, `squadId`, `swimmerId`, `startDate DateTime`, `endDate DateTime?`, `status` (`ACTIVE`, `SCHEDULED`, `HISTORICAL`), `notes`.
2. **Scheduled Future Moves Workflow:**
   * Coaches can plan squad moves weeks or months in advance without prematurely modifying current active training rosters.
   * Selecting swimmers and clicking "Schedule Promotion":
     * Sets target squad and effective date (e.g. `2027-05-01`).
     * Renders in the UI as **Scheduled Promotion** with a calendar badge.
   * **Automated Activation:** When `currentDate >= startDate`, the database resolver automatically recognizes the swimmer in the new squad; the prior squad membership record receives an `endDate` timestamp.
3. **Swimmer Progression Timeline:**
   * Visual audit trail on the swimmer's profile tracking their squad journey through the club (e.g., *Development (2024-2025) $\to$ County (2025-2026) $\to$ National (2026-Present)*).

#### 4.6.3 Squad Performance Intelligence & Analytics View (`/squads/[id]/performance`)
Designed specifically for Head Coaches to evaluate training block efficacy and competition readiness.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ SQUAD PERFORMANCE: Senior Performance (24 Swimmers · Head Coach: Marcus Vance)        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ OVERALL SQUAD IMPROVEMENT METRICS                                                      │
│ ⏱️ Total Time Dropped: -148.42s  |  🎯 PB Success Rate: 68.4%  |  📈 42 New PBs (Oct)   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ CHAMPIONSHIP QUALIFICATION TALLY BY STROKE                                             │
│ Stroke       County Cuts    Regional Cuts    National Cuts    Top Qualifying Event     │
│ Freestyle    18 Swimmers    7 Swimmers       2 Swimmers       100m Free (12 Qualified) │
│ Backstroke   14 Swimmers    5 Swimmers       1 Swimmer        100m Back (9 Qualified)  │
│ Breaststroke 11 Swimmers    4 Swimmers       2 Swimmers       200m Breast (7 Qualified)│
│ Butterfly     8 Swimmers    3 Swimmers       0 Swimmers       50m Fly (6 Qualified)    │
│ Ind. Medley  12 Swimmers    4 Swimmers       1 Swimmer        200m IM (8 Qualified)    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 💡 COACHING OPPORTUNITY MATRIX: CLOSEST TO ACHIEVING CUTS                              │
│ "Which stroke and distance is closest to achieving the most benefit for this squad?"   │
│                                                                                        │
│ 1. 🥇 100m Breaststroke (Regional Cut: 1:18.50) — 4 Swimmers within 0.60s:             │
│    • Oliver Wright (1:18.72 · 0.22s to cut) ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░ 98%                   │
│    • Lucas Campbell (1:18.95 · 0.45s to cut) ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░ 96%                  │
│    • Ethan Davies  (1:19.04 · 0.54s to cut) ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░ 95%                  │
│    👉 Coach Action: Targeting underwater pullout timing in practice could qualify 3!   │
│                                                                                        │
│ 2. 🥈 200m Freestyle (County Cut: 2:16.00) — 3 Swimmers within 0.85s:                  │
│    • Noah Bennett  (2:16.32 · 0.32s to cut) ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░ 97%                   │
│    • Jacob Evans   (2:16.70 · 0.70s to cut) ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░ 94%                   │
│                                                                                        │
│ 3. 🥉 50m Butterfly (County Cut: 31.00) — 3 Swimmers within 0.40s                      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Overall Squad Health & Progression:**
   * **Cumulative Time Dropped:** Total net seconds shed across the squad within the active season or selected date window.
   * **PB Conversion Rate:** Percentage of official race entries that resulted in lifetime or season personal bests.
   * **Volume of PBs:** Bar chart tracking monthly PB counts.
2. **Standards Matrix by Stroke & Distance:**
   * Interactive matrix mapping all competitive events (50m, 100m, 200m, 400m, 800m, 1500m across all 5 strokes).
   * Displays the count of squad swimmers meeting:
     * County Championship Standards (Bronze/Green).
     * Regional Championship Standards (Silver/Cyan).
     * National Championship Standards (Gold).
3. **The Coaching Opportunity & Benefit Optimizer:**
   * **Gap Analysis Formula:** Computes $\Delta t = \text{Swimmer PB} - \text{Standard Cut}$ across all swimmers in the squad for each target championship level.
   * **Clustered Opportunity Detection:** Automatically identifies races where multiple swimmers are clustered just outside qualifying thresholds ($< 1.0\text{s}$ for sprints, $< 2.5\text{s}$ for distance).
   * **Actionable Coaching Recommendations:** Surfaces high-ROI training focal points (e.g. *"Focusing on breaststroke turns and breakouts could qualify 3 additional swimmers for Regionals"*), giving coaches empirical data to tailor upcoming weekly training cycles.

---

### 4.7 Team & Staff Management (`/settings/team`)
* **Staff Directory:** Lists active coaches, admins, and timekeepers.
* **Invite Staff Member Flow (`<InviteForm />`):**
  * Generate a cryptographically secure, 7-day single-use token (`ClubInvitation`).
  * Select role: `ADMIN`, `COACH`, or `TIMEKEEPER`.
  * Generates a sharable link: `${BETTER_AUTH_URL}/invite/${token}`.
  * Admins can revoke pending invitations before they expire.

---

### 4.8 Club Profile & Branding (`/settings/club`)
* **Club Information:** Club official name, short name (e.g. "BASC"), unique alphanumeric club code.
* **Course Configuration:** Default pool length (`25m`, `50m`, `SCY`), standard lane count (6, 8, 10).
* **Custom Branding:** Upload club badge/crest SVG/PNG. Custom primary and secondary accent colors stored in `Club.customBranding` JSON to brand the live spectator views.

---

### 4.9 Billing & Stripe Subscription (`/billing`)
* **Usage Quota Display:**
  * Number of clubs owned as Administrator.
  * Free club allowance (default 1).
  * Status: Free Tier, Active Subscription, or Delinquent.
* **Stripe Integration:**
  * "Upgrade Subscription" button triggers Stripe Checkout session for additional club licenses.
  * "Manage Billing Portal" opens Stripe Customer Portal for updating payment methods, viewing invoices, or modifying subscription tier.
  * Webhook listener (`/api/stripe/webhook`) automatically updates `BillingAccount` records.

---

### 4.10 Superadmin Platform Portal (`/platform`)
* Guarded by `PLATFORM_ADMIN_EMAILS` check.
* Global tenant list with member count, gala count, and subscription status.
* Assignment of orphaned/legacy clubs migrated into the database without assigned owners.
* Platform configuration controls (adjust default free club limit per user).

---

## 5. UI Ergonomics & DeckGala Brand Compliance

All pages must adhere strictly to `deckgala_brand_guidelines.md` and reuse `@deckgala/controls`:

### 5.1 Color Tokens
```css
--color-deep-abyss:     #0B1528; /* Primary App Background */
--color-poolside-slate: #16233B; /* Card & Panel Surface */
--color-slate-elevated: #1E3152; /* Interactive / Hover Surface */
--color-electric-cyan:  #00E5FF; /* Brand Primary / Highlights / Accents */
--color-start-coral:    #FF5A36; /* Destructive / DQ / Emergency / Alert */
--color-pace-green:     #00E676; /* Active / Success / Synced */
--color-caution-amber:  #FFB300; /* Warning / Due Soon / Unofficial */
--color-frost-white:    #F4F7FB; /* Primary Crisp Text */
--color-muted-deck:     #8CA0BA; /* Secondary Label Text */
```

### 5.2 Typography Rules
* **UI & Headings:** `Plus Jakarta Sans` or `Inter` (`font-family: var(--deck-font-sans)`).
* **Timers, Splits, Seed Times, and Digits:** Strict tabular monospace (`font-family: var(--deck-font-mono); font-variant-numeric: tabular-nums;`).
* Numbers must NEVER visually jitter during live updates or table rendering.

### 5.3 High-Contrast Readability
* Pool deck coaches frequently view dashboards on tablets in humid or sunlit facilities.
* Minimum button touch targets: **44px** on desktop, **56px+** on touch/tablet views.
* Clear visual status tags (green for active/official, amber for pending/due soon, coral for DQ/expired).

---

## 6. Server Actions & API Contract

All mutations in MyClub use typed Next.js Server Actions with Zod validation.

### 6.1 Member & Swimmer Actions (`actions/member.ts`, `actions/swimmer.ts`)
```typescript
// Create Member & optional linked Swimmer record
export async function createMemberAction(formData: FormData): Promise<ActionResult<Member>>
// Update member details including DOB and governing body ID
export async function updateMemberAction(memberId: string, data: UpdateMemberInput): Promise<ActionResult<Member>>
// Renew membership by 1 year or custom date
export async function renewMembershipAction(memberId: string, expiresAt: string): Promise<ActionResult<void>>
// Record or edit Swimmer Personal Best
export async function upsertPersonalBestAction(swimmerId: string, data: PBInput): Promise<ActionResult<PersonalBest>>
// Fetch qualifying cut comparison for a swimmer against County/Regional/National standards
export async function getSwimmerQualifyingStandardsAction(swimmerId: string, ageRule: 'AGE_DEC_31' | 'AGE_DAY_OF_MEET'): Promise<QualifyingStandardComparison[]>
// Book/enter swimmer into an upcoming gala meet
export async function bookSwimmerGalaEntryAction(swimmerId: string, eventId: string, seedOption: 'PB' | 'NT' | 'CUSTOM', customTimeMs?: number): Promise<ActionResult<RaceResult>>
// Sync individual swimmer details, verified DOB, and official times with Swim England API
export async function syncSwimmerWithSwimEnglandAction(swimmerId: string): Promise<ActionResult<SwimEnglandSyncResult>>
// Batch sync all swimmers in a specific squad with Swim England API
export async function syncSquadWithSwimEnglandAction(squadId: string): Promise<ActionResult<SquadSyncSummary>>
// Club-wide batch refresh & compliance audit against Swim England API
export async function syncClubWithSwimEnglandAction(): Promise<ActionResult<ClubSyncAuditReport>>
```

### 6.2 Gala, Venue & Seeding Actions (`actions/gala.ts`, `actions/seeding.ts`, `actions/venue.ts`)
```typescript
// Create or save reusable pool venue
export async function createVenueAction(data: CreateVenueInput): Promise<ActionResult<Venue>>
// Fetch saved club venues for meet builder dropdown
export async function getClubVenuesAction(): Promise<Venue[]>
// Create new Gala meet with venue, base entry fee and default event pricing
export async function createGalaAction(data: CreateGalaInput): Promise<ActionResult<Gala>>
// Add Session to Gala (e.g. Session 1, Warmup & Start times)
export async function createGalaSessionAction(galaId: string, data: CreateSessionInput): Promise<ActionResult<GalaSession>>
// Add Event to Session with gender, age bracket, qualifying cuts, and fee override
export async function createEventAction(sessionId: string, data: CreateEventInput): Promise<ActionResult<Event>>
// Submit multi-child family entries from parent wizard
export async function submitParentGalaEntriesAction(data: SubmitParentEntriesInput): Promise<ActionResult<GalaEntrySubmissionResult>>
// Run Seeding Engine for an Event or Entire Gala (Spearhead or Cyclic)
export async function seedGalaEventsAction(galaId: string, options: SeedingOptions): Promise<ActionResult<void>>
// Toggle Public Live Stream Results to apps/results
export async function setGalaPublicStatusAction(galaId: string, isPublic: boolean): Promise<ActionResult<void>>
```

### 6.3 Results & Adjudication Actions (`actions/results.ts`)
```typescript
// Confirm heat results as Official
export async function confirmHeatOfficialAction(eventId: string, heatNumber: number): Promise<ActionResult<void>>
// Log Disqualification with infraction code
export async function disqualifySwimmerAction(resultId: string, infractionCode: string, notes?: string): Promise<ActionResult<void>>
// Adjust touch time with adjudicator note
export async function adjustResultTimeAction(resultId: string, correctedTimeMs: number, reason: string): Promise<ActionResult<void>>
```

### 6.4 Squad & Performance Intelligence Actions (`actions/squad.ts`)
```typescript
// Create or update training squad with coach assignments & timetable
export async function upsertSquadAction(data: UpsertSquadInput): Promise<ActionResult<Squad>>
// Schedule swimmer promotion with effective start date (e.g. May 1st)
export async function scheduleSquadPromotionAction(swimmerId: string, targetSquadId: string, effectiveDate: string, notes?: string): Promise<ActionResult<SquadMembership>>
// Bulk transition group of swimmers to target squad
export async function bulkPromoteSwimmersAction(swimmerIds: string[], targetSquadId: string, effectiveDate: string): Promise<ActionResult<void>>
// Query squad performance metrics, PB volume, and time drop analytics
export async function getSquadPerformanceAnalyticsAction(squadId: string, seasonYear: number): Promise<SquadPerformanceAnalytics>
// Calculate coaching opportunity gap analysis ("closest to achieving cuts by stroke/distance")
export async function getSquadCoachingOpportunityMatrixAction(squadId: string, standardLevel: 'COUNTY' | 'REGIONAL' | 'NATIONAL'): Promise<CoachingOpportunityCluster[]>
```

---

## 7. Phased Implementation Roadmap for Agent Swarms

To enable parallel execution by autonomous coding agents, the work is partitioned into 5 independent phases:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 1: App Shell, Navigation & Tenancy Routing                      │
│ (Layout, Header, Sidebar, Club Switcher, RBAC context, Route Groups)  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
┌─────────────────────────────────┐ ┌─────────────────────────────────┐
│ Phase 2: Roster & CRM Swarm     │ │ Phase 3: Gala & Meet Swarm      │
│ - Member table & filters        │ │ - Meet creator & event builder  │
│ - Swimmer profiles & PB matrix  │ │ - Swimmer entry management      │
│ - Expiry renewals & CSV import  │ │ - Seeding engine (heats/lanes)  │
└────────────────┬────────────────┘ └────────────────┬────────────────┘
                 │                                   │
                 └─────────────────┬─────────────────┘
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 4: Results Sync, Adjudication & Hy-Tek Export                    │
│ (Deck session ingestion, split review, DQ codes, .hy3 file generator)  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 5: Club Branding, Staff Invites, Stripe & Platform Superadmin    │
│ (Brand customizer, 7-day token invites, billing portal, platform page) │
└────────────────────────────────────────────────────────────────────────┘
```

### Phase 1: Shell, Navigation & Tenancy
* Implement responsive sidebar and header with DeckGala brand identity.
* Standardize `ClubSwitcher` and `requireActiveClub()` session wrapper.
* Establish route groups `(dashboard)` and `(auth)`.

### Phase 2: Member, Swimmer CRM & Squad Performance Swarm
* Create `/roster` page with searchable, sortable data table and squad filters.
* Build `/swimmers/[id]` swimmer profile view with:
  * Personal Best (PB) interactive matrix (Strokes $\times$ Distances) filterable by pool course (`25m`, `50m`, `SCY`).
  * County, Regional, and National qualifying cut time comparison engine driven by `dateOfBirth` (using `AGE_DEC_31` and `AGE_DAY_OF_MEET` competition rules).
  * Race history ledger with split times breakdown.
  * Gala attendance history (past galas) and future gala booking tracker.
* Build `/squads` management suite with:
  * Squad CRUD (descriptions, training schedules, coach assignments).
  * Temporal roster promotions with effective dating (e.g. scheduling moves to take effect on May 1st).
  * Squad performance analytics view (`/squads/[id]/performance`) showing aggregate time drops and PB conversion rates.
  * Coaching Opportunity Gap Analyzer identifying which stroke and distance has swimmers closest to crossing County, Regional, and National cuts.
* Build `/my-swimmers` family portal for parents managing multiple linked children.
* Implement Swim England Membership API client (`lib/swim-england-api.ts`) with individual, squad, and club-wide sync workflows.
* Implement membership renewal date alert components and batch renew action.
* Implement CSV roster import/export parser.

### Phase 3: Gala Meets, Venues & Parent Entry Swarm
* Build reusable Club Venue Directory & OpenStreetMap card component (`<VenueMap />`).
* Build `/galas` index, `/galas/new` wizard with fee structures (base gala fee + default event fee).
* Build Gala Sessions and Event Builder (`/galas/[id]`) with sessions hierarchy, gender markers (`M`/`F`/`Open`), and qualifying/cutoff times.
* Build `/galas/[id]/enter` Parent Multi-Child Entry Wizard with:
  * Automatic qualification filtering per child (hiding/badging non-qualified events).
  * Auto-populated seed times from personal bests.
  * Live fee calculator (gala fee + event fees across all children).
  * Payment prompt step with mock/skip payment toggle for development.
* Implement `lib/seeding-engine.ts` with standard spearhead lane seeding rules and printable poolside heat sheets.

### Phase 4: Results Adjudication & Exports
* Build `/galas/[id]/results` review table connected to Prisma `RaceResult` and `RaceSplit`.
* Build DQ logging modal with competitive swimming rule codes.
* Implement Hy-Tek `.hy3` exporter route at `/api/export/hytek/[galaId]`.
* Add live results publishing toggle connected to `apps/results`.

### Phase 5: Settings, Team, Billing & Polish
* Implement staff invite modal with 7-day token link generator.
* Build club branding settings page with custom colors and logo upload.
* Enhance `/billing` with Stripe portal links and quota locks.
* Verify `/platform` superadmin tools and write end-to-end unit tests.

---

## 8. Definition of Done & Quality Standards

1. **Zero Monorepo Drift:** Uses Bun workspace linking and `@deckgala/*` packages cleanly.
2. **Strict Multi-Tenancy:** Every database query filters by `clubId`; parent role restrictions verified with automated tests.
3. **Brand Token Integrity:** Strict adherence to Deep Abyss, Electric Cyan, Start Coral, and JetBrains Mono tabular digits.
4. **Type Safety:** 100% clean `bun run typecheck` (`tsc --noEmit`) with no `any` types.
5. **Fast Load Performance:** Sub-100ms Server Component rendering for roster and meet schedules.

---

## 9. Living Execution Tracker, Assumptions & Issues Log

**Last Updated:** 2026-10-29  
**Status:** Phase 3 Complete (34/34 Tests Passing) — Ready for Phase 4 (Results Sync, Adjudication & Hy-Tek Export)

### 9.1 Phase-by-Phase Progress Tracker
- [x] **Phase 0: Architectural Blueprint & Site Design**
  - [x] Complete domain modeling for MyClub, Swimmers, Galas, Venues, Squads, and Parents.
  - [x] Full route map and navigation hierarchy specification.
  - [x] Swim England Membership API integration specification.
- [x] **Phase 1: Shell, Navigation & Tenancy**
  - [x] Better Auth session validation and `requireClubRole` guard helpers.
  - [x] Cookie-backed multi-tenant switcher (`deckgala_active_club`).
  - [x] Full top navigation bar (`<AppHeader />`) with brand logo mark, user profile, billing/platform links, and alert banners.
  - [x] Responsive navigation bar (`<AppNav />`) with role-aware route tabs (`/`, `/roster`, `/squads`, `/galas`, `/my-swimmers`, `/settings/club`).
  - [x] Standardized `requireActiveClub()` session wrapper in `club-context.ts`.
  - [x] Dedicated navigation destination pages for `/roster`, `/squads`, `/galas`, `/my-swimmers`, and `/settings/club`.
- [x] **Phase 2: Swimmer CRM, PBs, Qualifying Standards, Swim England Sync & Squads**
  - [x] Enhanced Member & Swimmer creation linking `Member` and `Swimmer` in a transaction with DOB, gender, and squad.
  - [x] Member & Swimmer profile editing by Club Admins & Coaches (email, phone, Swim England ID, DOB, gender, squad, emergency contacts).
  - [x] Competition age calculation engine (`apps/myclub/src/lib/age-calculator.ts` with 100% test coverage).
  - [x] County, Regional, and National qualifying standards comparison engine (`apps/myclub/src/lib/qualifying-standards.ts` with 100% test coverage).
  - [x] Swim England Membership API client (`apps/myclub/src/lib/swim-england-api.ts`) supporting Individual, Squad, and Club sync with dev mock provider.
  - [x] Swimmer Profile view (`/swimmers/[id]`) with interactive PB Matrix, cut time proximity badges, and race history.
  - [x] Dedicated Club Swimmer Roster (`/swimmers`) providing direct club swimmer view, search, squad filtering, and quick squad assignment.
  - [x] Parent multi-child view (`/my-swimmers`).
  - [x] First-class `Squad` database entity (`model Squad` in Prisma) with full CRUD (`/squads`, `createSquad`, `updateSquad`, `deleteSquad`).
  - [x] Swimmer squad assignments and removals (`assignSwimmerToSquad`, `removeSwimmerFromSquad`) and temporal future promotions.
  - [x] Squad performance analytics and coaching opportunity gap matrix (`/squads/[name]/performance`).
- [x] **Phase 3: Gala Meets, Venues, Parent Entry Wizard & Sportsystems Ingestion**
  - [x] Club Venue directory (`Venue` model) and OpenStreetMap card component (`<VenueMap />`).
  - [x] Gala Sessions & Event Builder with fee structures (`/galas/[id]`).
  - [x] Gala Fixture & Event Schedule Editor (`/galas/[id]/edit`) allowing club coaches and admins to edit gala parameters (venue, pool course, schedule dates, fee policies, age calculation rules, visibility) and modify individual race events (distances, strokes, genders, age categories, qualification cuts, fee overrides, deletions).
  - [x] Parent Multi-Child Gala Entry Wizard with smart qualification filtering, live cost calculation, and skip payment toggle (`/galas/[id]/enter`).
  - [x] Seeding engine (`lib/seeding-engine.ts` with 100% test coverage for spearhead and cyclic seeding) and poolside heat sheets (`/galas/[id]/heats`).
  - [x] SPORTSYSTEMS Entry File Ingestion Engine (`lib/sportsys-parser.ts` with 100% test coverage for `.sef`, `.set`, `.sed`, CSV, and text export formats).
  - [x] Bulk entry ingestion server action (`importSportsysGalaEntries`) with automatic event creation, swimmer resolution by Swim England ASA number, seed time lock-in, and gala entry fees.
  - [x] Poolside Entry Importer UI (`<SportsysEntryUploader />`) with drag-and-drop, raw text paste, live preview cards, and feedback alerts on `/galas/[id]`.
- [ ] **Phase 4: Results Adjudication & Hy-Tek Export**
  - [ ] Deck session ingestion review table and split times display.
  - [ ] Official vs Unofficial adjudication actions and DQ code logging.
  - [ ] Hy-Tek `.hy3` format exporter route (`/api/export/hytek/[galaId]`).
- [ ] **Phase 5: Club Branding, Staff Invites & Platform Superadmin**
  - [ ] 7-day cryptographic invite token link generator.
  - [ ] Club branding settings (custom crest and accent colors).
  - [ ] Platform superadmin controls and Stripe subscription portal.

### 9.2 Technical Assumptions Log
1. **Swim England API Connectivity & Sandbox:**
   * *Assumption:* The Swim England API (`https://api-membership.swimming.org`) requires client credentials (`SWIM_ENGLAND_API_KEY`). For local development, testing, and continuous integration, a robust mock provider is built into `lib/swim-england-api.ts` that provides realistic member verification data, DOBs, categories, and certified times when live credentials are not set.
2. **Age Group Calculation Rules:**
   * *Assumption:* Competition age for County and Regional championships is calculated as age as of December 31st of the meet year (`galaYear - birthYear`). For open invitational galas where "Age on the Day" is specified, age is computed as calendar years elapsed on `gala.startsAt`.
3. **Database Schema Continuity:**
   * *Assumption:* The existing Prisma schema in `@deckgala/database` contains `Swimmer` (with `dateOfBirth`, `gender`, `squad`, `governingBodyId`), `PersonalBest`, `RaceResult`, and `RaceSplit`. New business logic builds cleanly on top of these verified schema entities.
4. **Parent-Child Linkage:**
   * *Assumption:* A parent user (`User` with role `PARENT`) links to swimmers via `Member.userId` or a family membership record, allowing a single parent to view and book galas for multiple children.
5. **First-Class Squad Model & Relational Assignments:**
   * *Assumption:* `Squad` is a dedicated Prisma model (`model Squad`) belonging to `Club` and linked relationally to `Swimmer` via `Swimmer.squadId` (with `Swimmer.squad` retained for backwards compatibility). Temporal future promotions (e.g. starting May 1st) are tracked via `Club.customBranding.scheduledPromotions`.
6. **OpenStreetMap Tile Embedding with Zero API Keys:**
   * *Assumption:* Interactive and dark-mode styled competition maps embed standard OpenStreetMap tiles (`openstreetmap.org/export/embed.html`) without requiring paid third-party mapping API keys or credentials.
7. **Multi-Child Cart Model & Lock-In Seed Times:**
   * *Assumption:* When parents submit gala entries for multiple children, personal best seed times are queried and locked in at submission time, while permitting "NT" (No Time) when allowed by the event's `allowNoTime` configuration.
8. **SPORTSYSTEMS Entry File Interchange & Resilience:**
   * *Assumption:* Meet entry files created by SPORTSYSTEMS Meet Organisation & Entry Manager (`.sef`, `.set`, `.sed`, and tabular CSV/TSV entry exports) can be directly uploaded to populate gala entries. Events not yet present in the gala program are automatically created. Swimmers are resolved by their Swim England membership number or name, existing profiles are updated, new club swimmers are provisioned if absent, and entries are recorded as confirmed with locked seed times.

### 9.3 Issues & Resolutions Log
* **Issue 1: Test Runner Typings (`bun:test` vs `node:test`):**
  * *Symptom:* TypeScript compile failed with `error TS2307: Cannot find module 'bun:test'`.
  * *Root Cause:* `@deckgala/myclub`'s `tsconfig.json` specifies `"types": ["node"]` rather than Bun runtime types.
  * *Resolution:* Standardized test files on Node's native test runner (`import { describe, it } from "node:test"` and `import assert from "node:assert/strict"`), which runs cleanly under both `bun test` and standard Node/TypeScript type checking.
* **Issue 2: Member Form Schema Synchronization:**
  * *Symptom:* Form validation needed to accept new optional swimmer fields (`dateOfBirth`, `gender`, `squad`, `isSwimmer`) without breaking existing member creation.
  * *Resolution:* Made new fields optional with safe nullish transformations and updated unit tests; all 34 unit tests across 8 files now pass with 0 errors.
* **Issue 3: Windows File Locking on Prisma Query Engine (`EPERM`) & IPv4 Loopback:**
  * *Symptom:* `prisma generate` failed with `EPERM: operation not permitted` on `query_engine-windows.dll.node` and `prisma db push` failed with `P1001: Can't reach database server at localhost:5432`.
  * *Root Cause:* Background Next.js dev server worker processes hold a file lock on the query engine native binary, and Prisma CLI on Windows requires explicit IPv4 `127.0.0.1` rather than `localhost` IPv6 loopback.
  * *Resolution:* Cleared Next worker process locks, updated `.env` to `127.0.0.1:5432`, generated Prisma client cleanly, and pushed the new `Squad`, `Venue`, `GalaEntry`, and `EventEntry` models directly into PostgreSQL.



