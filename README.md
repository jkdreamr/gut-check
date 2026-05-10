# Gut Check

Gut Check is a Newnal service agent that catches decision moments before they become regrets.

It is built for the Stanford AI OS Hackathon on top of Newnal Agent Place. Instead of blasting generic notifications, Gut Check waits until context, history, and timing line up, then sends a short personalized warning or nudge through Newnal Circle.

> A warning is only useful if it arrives before the swipe.

## Why this fits Newnal

Newnal is not just a profile store. It is an operating system for Personal AIs and service agents that can act on a person’s behalf.

Gut Check takes that seriously:

- it reads a Newnal Personal AI profile
- turns raw profile data into decision-ready signals
- watches for a live or demo decision moment
- decides whether interruption is actually worth it
- sends a Circle only when the moment earned it

The point is not "more notifications." The point is fewer, better interventions.

## What the product does

Gut Check combines five layers:

1. Newnal Personal AI profile retrieval and search
2. Decision moment detection
3. An 11-scenario rule engine
4. An autonomous policy layer that chooses `send_now`, `watch`, or `hold`
5. Newnal Circle delivery plus proposal logging and feedback

### Architecture

```text
Newnal Personal AI
        |
        v
Profile adapter + deterministic synthesis
        |
        v
Decision moment
(payment / location / restaurant / subscription / health)
        |
        v
11 core scenarios + optional WaveSpeed-generated scenarios
        |
        v
Autonomy policy
(timing, behavior fit, novelty, fatigue, acceptance history)
        |
        v
Proposal generation
        |
        v
Newnal Circle (/circle/simple by default)
        |
        v
Proposal log + acceptance feedback + pattern telemetry
```

## Wow features

### 1. Landing page + demo flow

`/` is the marketing front door. `/demo` is the judge-facing experience.

It lets you pick a live or demo decision moment and shows:

- the incoming payment or location signal
- supporting evidence cards
- matched scenarios
- the autonomy trace
- the final notification preview
- the actual Newnal send result

This is the fastest route to show the full product story in under two minutes.

### 2. Decision moments as first-class inputs

Gut Check does not just react to static profile traits. It accepts a structured `DecisionMoment`, including:

- `payment` moments
- `subscription` renewal moments
- `restaurant` moments
- `location` moments
- `health` moments

For demo purposes, transaction events are honest demo signals, not fake bank integrations. The abstraction is ready for future wallet or payment API hooks.

### 3. Optional system checks

`/health` runs a simple systems check for:

- Postgres
- Newnal
- WaveSpeed
- Anthropic fallback

This makes last-minute demo setup much less risky.

## Core scenarios

Gut Check ships with 11 core scenarios: 6 warnings and 5 nudges.

| ID | Name | Type | Trigger |
| --- | --- | --- | --- |
| W1 | Ghost Gym | warning | 2+ gym memberships cancelled within 90 days, plus a nearby gym or signup moment |
| W2 | Ghost Subscription | warning | 3+ underused subscriptions with 30+ days of drift |
| W3 | Repeat Regret | warning | 3+ purchases in one category, with poor follow-through |
| W4 | Friend Warning | warning | nearby place with weak friend ratings |
| W5 | Better Restaurant Nearby | warning | current restaurant choice loses to a nearby loyal favorite |
| W6 | Similar Disappointment | warning | similar items were returned or barely used before |
| P1 | Seasonal Gap | nudge | long seasonal gap plus a relevant nearby store |
| P2 | Dormant Interest Activated | nudge | searched before, never bought, now near the right place |
| P3 | New Version Available | nudge | old device plus nearby electronics context |
| P4 | Health Goal Alignment | nudge | stated goal, below a 7,500 step target, relevant place nearby |
| P5 | Loyal Spot Reminder | nudge | favorite place not visited in 60+ days, now nearby |

Each scenario emits:

- confidence
- evidence points
- proposal context

Those candidates then flow into the autonomous policy layer.

## Autonomous policy layer

The rule engine does not send on its own. Gut Check runs an autonomy pass that scores each candidate using:

- scenario confidence
- timing score
- behavior fit
- historical acceptance
- novelty
- fatigue penalty
- moment alignment
- adaptive floor

The final decision is one of:

- `send_now`
- `watch`
- `hold`

The UI exposes this trace so the interrupt feels technically legible rather than magical.

## WaveSpeed and Claude

WaveSpeed is optional, but when configured it can:

- synthesize extra scenario candidates beyond the fixed 11
- rewrite proposal copy to feel more human
- generate a short explanation of why the agent interrupted

Anthropic is also optional. It acts as a secondary model path for richer copy or policy review.

Important guardrails:

- the deterministic rule engine always remains the reliable fallback
- the app never depends on an LLM to keep demo mode working
- JSON parsing is defensive
- external models only receive compact structured context, not the full raw Newnal payload

## Demo moments

The demo flow ships with curated decision moments, including:

- About to pay for another gym membership
- Near a restaurant friends disliked
- About to buy a similar product they usually regret
- Unused subscriptions quietly draining money
- Near a place that matches a dormant goal

These moments combine:

- user profile history
- location context
- social signal
- payment intent signal
- behavioral patterns

Demo data is clearly labeled as `demo` or `synthetic` in the decision moment layer.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | marketing landing page with the video slot and product story |
| `/app` | working agent app: overview, learning loop, latest sends |
| `/demo` | judge-facing cinematic demo mode, with optional `?did=` support for real people |
| `/users` | live Newnal Plaza search in plain English |
| `/users/[did]` | full profile, signal cards, radar views, and Gut Check intercept panel |
| `/proposals` | local proposal history plus live Newnal `/circle/sent` view |
| `/scenarios` | read-only pattern telemetry |
| `/health` | optional system check page |

## Newnal API usage

Gut Check uses these Newnal Agent Place endpoints:

| Endpoint | Purpose |
| --- | --- |
| `POST /api/service-agent/personal-ai/search` | natural-language user discovery |
| `GET /api/service-agent/personal-ai/{did}` | full Personal AI profile retrieval |
| `POST /api/service-agent/circle/simple` | default live send route |
| `POST /api/service-agent/circle/template` | optional richer template-based Circle path |
| `GET /api/service-agent/circle/sent` | live delivery history |
| `POST /api/service-agent/drive/upload` | optional richer assets for future Circle payloads |

Gut Check defaults to `/circle/simple` because it has been the most reliable live send path in testing.

## Tech stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Recharts
- Prisma
- Hosted Postgres
- Newnal Agent Place API
- Optional WaveSpeed
- Optional Anthropic

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEWNAL_API_BASE` | yes | normally `https://agentplace.newnal.ai/api/service-agent` |
| `NEWNAL_API_KEY` | for live Newnal use | demo mode still works without it |
| `DATABASE_URL` | for logs and telemetry | must be hosted Postgres in deploy environments |
| `WAVESPEED_API_KEY` | optional | enables scenario synthesis and richer copy/review |
| `WAVESPEED_MODEL` | optional | defaults to `bytedance-seed/seed-1.6-flash` |
| `WAVESPEED_BASE_URL` | optional | defaults to `https://llm.wavespeed.ai/v1` |
| `ANTHROPIC_API_KEY` | optional | secondary model path |

## Local development

```bash
npm install
cp .env.example .env.local
```

Set a real Postgres URL in `.env.local`, then initialize the schema:

```bash
npm run db:push
```

Run the app:

```bash
npm run dev
```

Useful checks:

```bash
npm run lint
npm run build
```

## Deploying on Vercel

1. Create or attach a hosted Postgres database.
2. Set these environment variables in Vercel:
   - `DATABASE_URL`
   - `NEWNAL_API_KEY`
   - optionally `WAVESPEED_API_KEY`
   - optionally `WAVESPEED_MODEL`
   - optionally `WAVESPEED_BASE_URL`
   - optionally `ANTHROPIC_API_KEY`
3. Run the migration once against that Postgres database:

```bash
DATABASE_URL="your-postgres-url" npm run db:migrate
```

4. Deploy.

Notes:

- the build already runs `prisma generate`
- the app degrades gracefully if Newnal, WaveSpeed, or Postgres are missing
- demo mode still loads even when live integrations are unavailable

## Judge demo script

1. Open `/`.
2. Click `Try it out` or go straight to `/demo`.
3. Pick "About to pay for another gym membership" or "About to buy a product they usually regret."
4. Point out the incoming payment signal and location signal.
5. Run the check.
6. Show the scenario stack and the decision trace.
7. Explain that the agent can also choose to stay quiet.
8. Show the phone preview.
9. Send the Circle.
10. Open `/proposals` to show the feedback loop.

## Synthetic demo data

Not every signal exists in the raw Newnal API today. Gut Check uses deterministic synthesis for reproducible demos, including some:

- subscription usage patterns
- gym cancellation behavior
- friend ratings
- dormant searches
- nearby places

That synthesis is stable per DID so the same user produces the same demo conditions across runs.

Real Newnal data and synthetic/demo data are deliberately kept conceptually separate in the UI and code.

## Privacy boundary

- Newnal data is used server-side.
- Browser clients do not receive API keys.
- Demo and synthetic fields are labeled.
- External LLM calls receive compact structured context rather than full raw profile dumps.
- Sensitive data should stay excluded from prompts unless explicitly permitted.

## Reliability notes

- No page should hard-crash if `DATABASE_URL` is missing or invalid.
- If Newnal is missing, the demo still works in safe demo mode.
- If WaveSpeed is missing, deterministic proposal generation and autonomy still work.
- Prisma routes are server-only and marked dynamic where needed.

## Hackathon framing

Gut Check is a service agent with restraint.

It does not assume every insight deserves an interruption. It waits for the narrow slice of time where a person is actually about to do something, checks whether the evidence is strong enough, and only then tries to help.
