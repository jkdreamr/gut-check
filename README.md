# The Gut Check

A Newnal Service Agent for the Stanford AI OS Hackathon (May 9–10, 2026).

> Sends personalized, data-driven proposals to users at the moment of decision —
> warning them against purchases they've regretted before, nudging them toward
> opportunities their data already says they want, and optionally synthesizing
> new intervention angles beyond the fixed core scenarios.

This Service Agent runs on top of the [Newnal Agent Place](https://agentplace.newnal.ai/)
public API. It discovers Personal AIs in the Newnal Plaza, runs their categorized
profile through an **11-scenario rule engine**, lets an **autonomous policy layer**
decide whether interruption is justified, generates proposal copy, and fires it as
a **Newnal-Circle** to the user's phone.

## What it does

The Gut Check ships **6 warnings + 5 nudges**:

| ID  | Name                       | Type    | Trigger (high level) |
|-----|----------------------------|---------|----------------------|
| W1  | Ghost Gym                  | warning | 2+ past gyms cancelled <90 days, near a gym |
| W2  | Ghost Subscription         | warning | 3+ active subs unused for 30+ days |
| W3  | Repeat Regret              | warning | 3+ purchases in same category, >50% abandoned |
| W4  | Friend Warning             | warning | Restaurant nearby with avg friend rating <3.0 |
| W5  | Better Restaurant Nearby   | warning | A loyal spot is closer than the new option |
| W6  | Similar Disappointment     | warning | 2+ similar past purchases returned/underused |
| P1  | Seasonal Gap               | nudge   | No seasonal purchase in 12+ months, near store |
| P2  | Dormant Interest Activated | nudge   | Searched 30–180 days ago, never bought, now near store |
| P3  | New Version Available      | nudge   | Tech purchase 18+ months old, near electronics store |
| P4  | Health Goal Alignment      | nudge   | Stated goal + below target + nearby gym + no ghost-gym pattern |
| P5  | Loyal Spot Reminder        | nudge   | 5+ visit / 70%+ return spot, not visited 60+ days, now nearby |

## How it talks to Newnal

| Endpoint | Used for |
|----------|----------|
| `POST /api/service-agent/personal-ai/search` | Natural-language discovery in the Plaza |
| `GET  /api/service-agent/personal-ai/{did}`  | Categorized personal + AI data |
| `POST /api/service-agent/circle/simple`      | Fallback raw text Newnal-Circle |
| `POST /api/service-agent/circle/template`    | Default — UI-template-driven Circle (preset `official.admin.update.notice`) |
| `GET  /api/service-agent/circle/sent`        | "Live from Newnal" panel on the Proposals page |
| `POST /api/service-agent/drive/upload`       | Optional background image / voice URL for richer cards |

The Gut Check sends Newnal-Circles by default through the
**official.admin.update.notice** UI Template (placeholders
`Simple Text0-headline` and `Simple Text0-body`) so they render as the same
notice card the platform itself uses.

## Autonomous policy layer

The rule engine is no longer operator-tuned. Each triggered scenario now flows
through an autonomous policy layer that:

- computes a **model-owned adaptive floor** per scenario
- blends evidence strength, timing, fatigue, and historical acceptance
- decides whether to **send now** or **hold**
- selects the winning scenario automatically

If `ANTHROPIC_API_KEY` is present, Claude reviews the heuristic decision and can
override the final dispatch posture. Without it, the embedded autonomy engine
still runs deterministically.

If `WAVESPEED_API_KEY` is present, the app can also:

- synthesize additional scenario candidates beyond the fixed 11
- review send/hold posture through WaveSpeed's OpenAI-compatible LLM endpoint
- generate proposal copy through WaveSpeed instead of the template path

## Synthesis adapter

Some signals the rule engine wants — gym cancellation history, subscription
*usage* frequency, friends' ratings of nearby places, phone search history with
categories, nearby-place telemetry — are **not exposed** in the live Newnal API.
The Gut Check's [synthesis adapter](lib/synthesize.ts) deterministically fills
these gaps from a DID-seeded RNG. Two calls with the same DID always produce
the same synthesized profile, so screenshots, demos, and proposal logs stay
reproducible. Real fields (recent purchases, restaurants, education, language,
character/values radar values, location) come from the API verbatim.

## Stack

- Next.js 14 (App Router), TypeScript
- Tailwind CSS + Recharts (radar + bar charts)
- Prisma + hosted Postgres (proposal log + scenario telemetry)
- Optional WaveSpeed LLM (`WAVESPEED_API_KEY`) for dynamic scenario synthesis,
  proposal copy, and policy review
- Optional Anthropic Claude (`ANTHROPIC_API_KEY`) for richer proposal copy
  and policy-layer review; ships with deterministic fallbacks that require no key

## Setup

```bash
npm install
cp .env.example .env.local       # then fill in NEWNAL_API_KEY
npx prisma db push               # creates the schema in your hosted Postgres
npm run dev                      # http://localhost:3000
```

`.env.local`:

```env
NEWNAL_API_BASE=https://agentplace.newnal.ai/api/service-agent
NEWNAL_API_KEY=nsa_<your-key>
DATABASE_URL="postgresql://postgres:password@db.example.com:5432/gut_check?sslmode=require"
WAVESPEED_API_KEY=
WAVESPEED_MODEL=bytedance-seed/seed-1.6-flash
WAVESPEED_BASE_URL=https://llm.wavespeed.ai/v1
# Optional — set to enable Claude-generated proposal copy:
# ANTHROPIC_API_KEY=
```

For Vercel, set the same `DATABASE_URL` in Project Settings to a hosted Postgres
instance. The build now runs `prisma generate` automatically. If the database is
new, run `npm run db:migrate` or `npm run db:push` once before first use so the
`ProposalLog` and `ScenarioConfig` tables exist.

WaveSpeed notes:

- The LLM endpoint is `https://llm.wavespeed.ai/v1`
- Model calls use the OpenAI Chat Completions format
- WaveSpeed's docs say API keys require an activated/top-upped account before
  they work

## Pages

| Route                | What's there |
|----------------------|--------------|
| `/`                  | Dashboard: autonomous doctrine + acceptance chart + recent dispatches |
| `/users`             | Plaza search via natural-language query, results grid with mini-radar per user |
| `/users/[did]`       | Detail: credibility score, profile snapshot pills, 2 radar charts, 4 category cards, **AI Decision Layer** autopilot panel |
| `/proposals`         | Local history table + "Live from Newnal" panel reading `/circle/sent` |
| `/scenarios`         | `AI Brain`: read-only governance board showing adaptive floors, autonomous posture, and any live WaveSpeed-generated scenarios |
| `/demo`              | Full-screen autonomous live demo with 3 mock users + AI-owned send/hold decisions |

## API routes

| Route                              | Wraps |
|-------------------------------------|-------|
| `GET  /api/users?q=<NL>`            | `/personal-ai/search` (returns adapted user summaries) |
| `GET  /api/users/[did]`             | `/personal-ai/{did}` (returns adapted profile) |
| `POST /api/analyze`                 | runs the 11 scenarios + autonomous policy layer + top-3 proposal copy |
| `POST /api/propose`                 | sends via `/circle/template` (or `/circle/simple`) and logs |
| `GET  /api/proposals` / `PATCH`     | local history + acceptance toggle |
| `GET  /api/scenarios`               | read-only AI governance telemetry |
| `GET  /api/circle/sent`             | proxies `/circle/sent` for the live panel |
| `POST /api/drive/upload`            | proxies `/drive/upload` |

## Demo Mode

The `/demo` route ships three engineered mock users that *guarantee* specific
scenarios fire:

- **Alex Park** (28, SF) → Ghost Gym (2 cancelled gym memberships, near a new one)
- **Jordan Reyes** (34, Palo Alto) → Friend Warning (nearby restaurant rated 2.3/5 by 5 friends)
- **Sam Chen** (26, Menlo Park) → Dormant Interest (Brooks Ghost 16 search 45 days ago, near Fleet Feet)

When the demo user is selected, sends are simulated locally rather than firing a
Newnal-Circle, so you can present without polluting the live `/circle/sent` log.

## License

Built for the Stanford AI OS Hackathon. MIT.
