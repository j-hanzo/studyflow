# Lumen — Product Specification
*Last updated: March 2026*

---

## Product Vision

Lumen is the academic co-pilot for students from middle school through college. It eliminates the friction between "going to class" and "actually learning the material" — capturing what students receive, organizing it intelligently, and using AI to turn raw notes and handouts into structured study support. Parents get the visibility they've always wanted without becoming helicopter parents.

---

## Users

### Student (Primary)
- Age: 11–22 (middle school through college)
- Motivation: Less stress, better grades, not forgetting things
- Friction points: Too much paper, forgetting due dates, not knowing how to study

### Parent (Paying Customer)
- Age: 35–55
- Motivation: Peace of mind, knowing their kid is on track
- Friction points: Kid won't tell them anything, surprised by bad grades

### College Student (Secondary Paying Customer)
- Self-pays after high school
- May optionally keep parent view-only access ("Mom can see I'm studying, stops texting me")

---

## Core Features

### 1. Class Management
- Student adds classes (name, teacher, period, color)
- Each class becomes a container for materials, assignments, and notes
- Visual color coding throughout the app

### 2. Material Capture
- **Photo capture** — point phone at handout, auto-extracts text via Claude Haiku (OCR)
- **File upload** — PDF, JPG, PNG
- **Paste text** — copy from digital source
- Original photo/file stored in Supabase Storage
- Extracted text stored in database (searchable)
- AI auto-suggests title and tags
- Student categorizes as: Notes / Assignment / Handout
- Optional: attach due date (creates assignment record automatically)

### 3. Assignment & Exam Tracking
- Student adds assignments and exams with due dates
- Types: Assignment / Exam / Quiz
- Calendar view with color-coded events by class
- Upcoming deadlines visible on dashboard
- Completion tracking

### 4. AI Study Planner
- Triggered when an exam is added
- Claude Sonnet analyzes: captured notes, time until exam, student's schedule
- Generates day-by-day study plan (study_sessions table)
- Each session has: title, duration, linked assignment, scheduled date
- Sessions appear on student dashboard as today's to-do list
- Student can check off sessions as completed
- Parent can see if study sessions are being completed

### 5. AI Tutor (Chat)
- Full chat interface
- Context: student's captured notes for the relevant class
- Can answer questions about specific material
- Can explain concepts in plain language
- Generates practice questions on demand
- Creates full practice exams (timed or untimed)
- Suggests what to focus on before an exam
- Remembers conversation context within session

### 6. Student Dashboard
- Greeting with time of day
- Stats: tasks completed today, study streak, days to next exam, class count
- Today's study plan (AI-generated sessions, checkable)
- Class grid (click to enter class)
- Upcoming deadlines (next 7 days)
- AI recommendation card
- Unread parent messages

### 7. Parent Dashboard
- Per-student cards showing:
  - Tasks completed today
  - Upcoming deadlines and exams
  - AI weekly summary ("Jordan studied 4.5hrs this week")
  - Recent activity
  - Alerts (exam in X days)
- Family-level alerts banner
- Message thread per student
- Reminder management

### 8. Parent-Student Messaging
- Simple in-app chat between parent and each student
- Parent can send encouragement or reminders
- Student can message parent for help
- Push notifications (mobile) / email fallback

### 9. Reminders & Notifications
- Study reminders: "Time to review Biology — exam in 3 days"
- Assignment reminders: "Essay due tomorrow"
- Parent alerts: "Jordan hasn't logged in today"
- Configurable by parent (time of day, frequency)
- Delivery: push notification (mobile) + email (web)

---

## Screens

| Screen | Route | Who Sees It |
|---|---|---|
| Login | /login | All |
| Sign Up | /signup | All |
| Onboarding | /onboarding | New users |
| Student Dashboard | / (student) | Student |
| Parent Dashboard | / (parent) | Parent |
| Class Detail | /class/[id] | Student |
| Capture | /capture | Student |
| Calendar | /calendar | Student |
| AI Tutor | /tutor | Student |
| Messages | /messages | Both |
| Reminders | /reminders | Parent |

---

## Technical Architecture

### Frontend
- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS** (utility-first styling)
- **Lucide React** (icons)
- Server components for data fetching, client components for interactivity

### Backend
- **Supabase** — Postgres database, Auth, Storage, Row Level Security
- All data isolated per user via RLS policies
- File storage: `materials` bucket (original photos/PDFs)

### AI (Claude API)
- **Claude Haiku** — OCR extraction, auto-tagging, background summarization (cost-optimized)
- **Claude Sonnet** — Tutor chat, study plan generation, practice exams (quality-optimized)
- Context built from student's captured notes per class
- Prompt caching for repeated context at scale

### Mobile (Planned)
- **React Native + Expo** — iOS and Android
- Camera integration for photo capture
- Push notifications via Expo Notifications + Firebase
- Shares component logic with web app

### Payments (Planned)
- **Stripe** — subscription management
- Webhook handling for plan changes, cancellations
- Customer portal for self-serve billing

### Email (Planned)
- **Resend** — transactional email
- Study reminders, assignment alerts, parent digests

---

## Data Model

```
profiles          — user identity, role (student/parent), grade
family_links      — parent ↔ student relationships
classes           — student's classes (name, teacher, color)
materials         — captured content (text + photo URL + tags)
assignments       — due dates, types (assignment/exam/quiz), completion
study_sessions    — AI-generated daily study tasks
messages          — parent ↔ student chat
```

---

## Privacy & Compliance

- **COPPA** — users under 13 require parental consent flow (to be built)
- **FERPA** — student data not shared with third parties
- **Data residency** — Supabase US region
- Row Level Security on all tables — users can only access their own data
- Photos stored privately (signed URLs, not public)
- No student data used for AI model training

---

## Build Roadmap

### Phase 1 — Foundation (Complete)
- [x] All UI screens designed
- [x] Auth (login, signup, role selection)
- [x] Database schema with RLS
- [x] Student + Parent dashboards with live data
- [x] Add Class functionality

### Phase 2 — Core Functionality (In Progress)
- [ ] Add Assignment / Exam
- [ ] Capture → Storage + Claude OCR
- [ ] Calendar with live data
- [ ] AI Tutor → Claude API
- [ ] Study plan generator

### Phase 3 — AI Features
- [ ] Practice exam generator
- [ ] Smart flashcard creation
- [ ] Note summarization
- [ ] Personalized study recommendations

### Phase 4 — Social & Engagement
- [ ] Parent-student messaging (real-time)
- [ ] Study streaks + gamification
- [ ] Email reminders (Resend)
- [ ] Push notifications

### Phase 5 — Mobile & Scale
- [ ] React Native / Expo mobile app
- [ ] Stripe subscription management
- [ ] School/district B2B portal
- [ ] COPPA compliance flow

---

*Lumen — Clarity from chaos.*
