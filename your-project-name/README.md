# Study Sprint

A study accountability app that reduces procrastination by making studying visible and easy to join, so students feel accountable without pressure.

## Features

### 🏃 Study Sprints
- Start focused study sessions with a timer (25, 50, or 90 minutes)
- Specify what class you're studying
- See active sprints from friends in real-time

### 👥 Social Accountability
- Friends can see when you're in an active sprint
- See what class someone is studying and how much time is left
- Join a friend's sprint instantly with one click
- Study together silently on the same timer

### 🔥 Streak Tracking
- Build daily study streaks by completing sprints
- Track your longest streak and total sprints
- Light accountability through gentle visual cues
- No punishment—just encouragement to stay consistent

### ⏱️ Real-time Updates
- Live countdown timer for active sprints
- See participant count in real-time
- Get notified when sprints complete

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **UI**: Tailwind CSS + shadcn/ui components
- **TypeScript**: Full type safety

## Database Schema

### Tables

- `sprints` - Study sprint sessions
- `sprint_participants` - Tracks who joins which sprint
- `user_streaks` - Daily streak tracking
- `friendships` - Friend connections (ready for future use)

### Key Features

- Row Level Security (RLS) for data privacy
- Real-time subscriptions for live updates
- Automatic streak calculation
- Friend visibility controls

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up your environment variables (copy `.env.example` to `.env.local`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Run the Supabase migrations (local or linked project):
   ```bash
   supabase db push
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

## Deploying to Vercel

**If you can't create a sprint on Vercel**, see **[docs/DEPLOYMENT_VERCEL.md](docs/DEPLOYMENT_VERCEL.md)** for a full checklist (env vars, migration, Supabase Auth URLs, and logging in on the deployed site).

1. Link the repo to Vercel and add the Supabase env vars (or use the Supabase–Vercel integration).
2. **If "Start sprint" errors with** `Could not find the table 'public.sprints' in the schema cache`:
   - The Supabase project that Vercel uses doesn’t have the sprints schema yet.
   - In **Supabase Dashboard** → your (production) project → **SQL Editor** → New query:
   - Copy the contents of **`supabase/apply-sprints-migration.sql`** and run it once.
   - Redeploy or refresh the app; "Start sprint" should then work.

## Usage

### Starting a Sprint

1. Log in to your account
2. Enter the class you're studying
3. Choose a duration (25, 50, or 90 minutes)
4. Click "Start Sprint"

### Joining a Friend's Sprint

1. View the "Active Sprints" feed
2. See which friends are currently studying
3. Click "Join" on any active sprint
4. You'll sync to their timer

### Building Streaks

- Complete at least one sprint per day to maintain your streak
- Your streak automatically increments when you study on consecutive days
- Track your progress in the dashboard

## Future Features

- Friend requests and management
- Study groups and teams
- Sprint history and analytics
- Gentle nudges when you haven't studied in a while
- Study insights and patterns

## License

MIT
