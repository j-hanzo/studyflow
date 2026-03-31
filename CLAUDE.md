@AGENTS.md

# Lumen — Project Briefing

## What This Is
Lumen is a commercial AI-powered study management app for students (middle school through college) and parents. Parents pay the subscription; college students can take over payment while parents retain a view-only dashboard.

## App Name
**Lumen** — chosen for its connotation of clarity, light from chaos, and premium feel. Previous placeholder name was StudyFlow.

## Live URLs
- **Production:** https://studyflow-ashy-eight.vercel.app (Vercel — needs domain rename when ready)
- **GitHub:** https://github.com/j-hanzo/studyflow
- **Supabase project:** https://kaqoqbmntdwtklukpbfg.supabase.co

## Tech Stack
| Layer | Technology | Why |
|---|---|---|
| Web / Desktop | Next.js 16 + Tailwind CSS | React-based, Vercel-native, fast iteration |
| Mobile (future) | React Native / Expo | Same components, iOS + Android |
| Backend / Auth | Supabase | Auth, Postgres DB, file storage, free tier |
| AI Features | Claude API (Anthropic) | OCR, tutoring, study plans, practice exams |
| Payments (future) | Stripe | Subscriptions |
| Email (future) | Resend | Reminders, notifications |
| Hosting | Vercel (free tier) | Auto-deploys from GitHub main branch |

## Color Palette
- Primary: Indigo (#4F46E5)
- Success/complete: Emerald (#10B981)
- Urgency/exams: Rose (#f43f5e)
- Energy/deadlines: Amber (#f59e0b)
- Background: Slate-50

## Database Schema (Supabase)
Tables: `profiles`, `classes`, `materials`, `assignments`, `messages`, `study_sessions`, `family_links`
RLS enabled on all tables. Auto-create profile trigger on auth.signup.
Storage bucket: `materials` (for captured photos)

## Build Status — What's Done
- [x] All UI screens (dashboard, parent, capture, calendar, class detail, AI tutor, login, signup)
- [x] Supabase auth (login, signup with student/parent role selection, email confirmation)
- [x] Middleware — all routes protected, redirects to /login
- [x] Student dashboard connected to live Supabase data
- [x] Parent dashboard connected to live Supabase data
- [x] Add Class modal (saves to Supabase, color picker, refreshes on save)
- [x] Sign out

## What's Next (in order)
1. Add Assignment / Exam flow (with due date → feeds calendar)
2. Connect Capture page → Supabase Storage (photo upload) + Claude API (OCR text extraction)
3. Wire Calendar to live assignment data
4. Connect AI Tutor to Claude API (chat against student's real notes)
5. AI Study plan generator (auto-create study_sessions before exams)
6. Practice exam generator
7. Parent-student messaging (real-time)
8. Email reminders (Resend)
9. React Native mobile app

## Business Decisions Made
- Subscription model: Parent pays (~$19.99/mo family plan)
- AI cost: Absorbed in subscription, NOT BYOK
- Model routing: Haiku for OCR/tagging, Sonnet for tutor/exams
- Target: Middle school → college (parent pays, college student can take over)
- Estimated AI cost per active student: ~$1.10/month

## Key Files
- `app/page.tsx` — root route, server component, fetches data, renders student or parent dashboard
- `app/components/StudentDashboard.tsx` — client component, student view
- `app/components/ParentDashboard.tsx` — client component, parent view
- `app/components/Sidebar.tsx` — shared navigation with mode switcher
- `app/components/AddClassModal.tsx` — add class modal
- `lib/supabase/client.ts` — browser Supabase client
- `lib/supabase/server.ts` — server Supabase client
- `lib/supabase/types.ts` — full TypeScript types for all tables
- `middleware.ts` — auth protection for all routes
- `supabase/schema.sql` — full DB schema (run once in Supabase SQL editor)

## Owner
GitHub: j-hanzo | Email: jaehunsim@gmail.com | UX Designer background
