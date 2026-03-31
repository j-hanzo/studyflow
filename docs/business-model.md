# Lumen — Business Model
*Last updated: March 2026*

---

## The Problem

Students are drowning in paper handouts, digital PDFs, scattered notes, and missed deadlines. Parents have zero visibility into what their kids are doing — or not doing — until a bad grade appears. Existing tools (Google Classroom, Notion, physical planners) require discipline that most middle and high schoolers don't have. None of them are AI-native.

---

## The Solution

Lumen is an AI-powered study management platform that:
- Captures class materials (photo or paste) and extracts text automatically via Claude AI
- Organizes everything by class and type (notes, assignments, handouts)
- Generates study schedules and to-do lists based on upcoming exams
- Tutors students in real-time using their own notes as context
- Creates practice exams from captured material
- Gives parents a dashboard with summaries, alerts, and messaging

---

## Target Market

**Primary:** Parents of middle and high school students (grades 6–12)
**Secondary:** College students who self-pay
**Geography:** English-speaking markets initially (US, Canada, UK, Australia)

**Market size:**
- ~26 million middle + high school students in the US
- ~19 million college students in the US
- Parents spend an average of $1,600/year on education support (tutoring, tools, etc.)
- The US EdTech market is ~$43B and growing at 16% CAGR

**Why now:**
- AI has crossed the threshold where tutoring quality rivals human tutors
- Gen Z students are comfortable with AI tools
- Parents increasingly anxious about academic performance post-COVID
- No incumbent product owns this exact combination of capture + AI + parent visibility

---

## Business Model

### Subscription Pricing

| Plan | Price | Who | Features |
|---|---|---|---|
| **Free** | $0/mo | Any student | 1 class, 3 captures/month, no AI |
| **Student** | $9.99/mo | 1 student (self-pay) | Unlimited capture + OCR, AI tutor (50 msgs/mo), calendar |
| **Family** | $19.99/mo | Parent pays | Up to 4 students, unlimited everything, parent dashboard, messaging, reminders |
| **College** | $12.99/mo | Student self-pays | All Student features + optional parent view-only access |

*Annual pricing: 2 months free (e.g. Family = $199/year)*

### Revenue Model
- Primary: recurring monthly/annual subscriptions (SaaS)
- Future: school/district B2B licenses
- Future: white-label for tutoring centers

---

## Unit Economics

### AI Cost Breakdown (per active student/month)

| Feature | Model Used | Est. Usage | Est. Cost |
|---|---|---|---|
| OCR text extraction | Claude Haiku | 50 photos | ~$0.05 |
| AI tutor chat | Claude Sonnet | 100 messages | ~$0.80 |
| Study plan generation | Claude Sonnet | 4 plans | ~$0.10 |
| Practice exam generation | Claude Sonnet | 5 exams | ~$0.25 |
| Auto-tagging / summarizing | Claude Haiku | Background | ~$0.03 |
| **Total AI cost per student** | | | **~$1.23/mo** |

*Note: Anthropic prompt caching reduces repeated context costs by ~70% at scale*

### Family Plan Economics (4 students)

| Item | Amount |
|---|---|
| Monthly revenue | $19.99 |
| AI costs (4 students × $1.23) | -$4.92 |
| Infrastructure (Supabase, Vercel, etc.) | -$0.50 |
| Payment processing (Stripe 2.9% + $0.30) | -$0.88 |
| **Gross margin per family** | **~$13.69 (68%)** |

### Student Plan Economics

| Item | Amount |
|---|---|
| Monthly revenue | $9.99 |
| AI costs (1 student) | -$1.23 |
| Infrastructure | -$0.20 |
| Payment processing | -$0.59 |
| **Gross margin per student** | **~$7.97 (80%)** |

---

## Growth Model

### Key Metrics to Track
- **MRR** (Monthly Recurring Revenue)
- **CAC** (Customer Acquisition Cost) — target < $30
- **LTV** (Lifetime Value) — target > $300 (15+ month retention)
- **LTV:CAC ratio** — target > 10:1
- **Churn rate** — target < 3%/month (school year drives natural retention)

### Acquisition Channels
1. **Organic / SEO** — "AI study helper", "homework help app", "parent student app"
2. **App Store / Google Play** — mobile-first discoverability
3. **TikTok / Instagram** — student-to-student sharing ("look what this AI did with my notes")
4. **Parent Facebook Groups** — word of mouth in local school communities
5. **School partnerships** — direct outreach to guidance counselors
6. **Referral program** — "give a friend 1 month free, get 1 month free"

### Revenue Projections (Conservative)

| Milestone | Families | MRR | ARR |
|---|---|---|---|
| Month 6 | 100 | $2,000 | $24,000 |
| Month 12 | 500 | $10,000 | $120,000 |
| Month 18 | 2,000 | $40,000 | $480,000 |
| Month 24 | 5,000 | $100,000 | $1,200,000 |
| Month 36 | 15,000 | $300,000 | $3,600,000 |

*Assumes 70% Family plan, 30% Student plan. Conservative growth. Does not include B2B.*

---

## Competitive Landscape

| Product | What They Do | Gap Lumen Fills |
|---|---|---|
| Google Classroom | School-managed, teacher-facing | No student AI, no parent dashboard |
| Notion | General note-taking | No AI tutor, no capture, no parent view |
| Chegg / Course Hero | Homework answers | Reactive, not proactive; no organization |
| Khan Academy | Video lessons | No personal material capture |
| Photomath | Math only | Single subject, no organization |
| Quizlet | Flashcards | No capture, no tutor, no parent layer |

**Lumen's defensible position:** The only app that combines capture → AI extraction → personal tutor → parent visibility in one seamless product. The parent layer is particularly hard to replicate — it requires a trust relationship that incumbents don't have.

---

## Funding Considerations

### What We'd Use Seed Funding For
- Mobile app development (React Native — iOS + Android)
- Marketing / user acquisition
- Customer support infrastructure
- School/district sales (B2B channel)
- Compliance (COPPA, FERPA for under-13 features)

### Ideal Seed Round
- **Amount:** $500K–$1.5M
- **Use:** 18 months runway, team of 3–4
- **Target investors:** EdTech-focused angels, former education company founders

### Key Risks
1. **AI cost at scale** — Mitigated by model routing (Haiku vs Sonnet) and prompt caching
2. **Student engagement** — Mitigated by gamification (streaks, progress) and parent-driven retention
3. **Competition from big tech** — Google, Apple, Microsoft could build this. Mitigated by moving fast and owning the parent-student relationship before they do
4. **School IT restrictions** — B2C (parent/student direct) avoids school procurement cycles

---

*Document prepared for internal use and investor conversations.*
*Lumen — Clarity from chaos.*
