// lib/proposal-generator.ts — generate the proposal copy that lands on
// the user's Newnal phone.
//
// Two paths:
//   1. Deterministic template (default) — high-quality, on-brand copy
//      driven by scenario id + evidence + persona. Ships zero-config.
//   2. Anthropic Claude (optional) — used when ANTHROPIC_API_KEY is set
//      in the environment. Same prompt as the original spec.

import type {
  NewnalUserProfile,
  ScenarioResultTriggered,
} from './types';

export interface GeneratedProposal {
  headline: string;
  body: string;
  source: 'template' | 'claude';
}

// ─── Template generator (default, no key required) ────────────────────────

function fmtMoney(n: number): string {
  if (n >= 1000) return `$${Math.round(n / 100) / 10}k`;
  return `$${Math.round(n)}`;
}

function templateFor(
  scenario: ScenarioResultTriggered,
  user: NewnalUserProfile,
): GeneratedProposal {
  const ctx = scenario.proposalContext as Record<string, unknown>;
  const firstName = user.displayName.split(' ')[0];

  switch (scenario.scenarioId) {
    case 'W1_GHOST_GYM': {
      const gym = String(ctx.nearbyGym ?? 'this gym');
      const days = Math.round(Number(ctx.avgDays ?? 60));
      const count = Number(ctx.gymCount ?? 2);
      return {
        headline: `${firstName}, before you sign up at ${gym}.`,
        body: `You've joined ${count} gyms before — and stopped going within ${days} days each time. Same impulse, same momentum, same data. What would make this one different?`,
        source: 'template',
      };
    }
    case 'W2_GHOST_SUBSCRIPTION': {
      const worst = ctx.worst as { name?: string; daysSince?: number; monthlyCost?: number } | undefined;
      const monthlyWaste = Number(ctx.monthlyWaste ?? 0);
      const ghostCount = Number(ctx.ghostCount ?? 1);
      return {
        headline: `${ghostCount} subscriptions you're not using.`,
        body: `${worst?.name ?? 'One of them'} hasn't been opened in ${worst?.daysSince ?? '30+'} days, but it's still charging you ${fmtMoney(worst?.monthlyCost ?? 12)}/mo. Total quiet bleed: ${fmtMoney(monthlyWaste)}/mo.`,
        source: 'template',
      };
    }
    case 'W3_REPEAT_REGRET': {
      const cat = String(ctx.category ?? 'this category');
      const rate = Math.round((ctx.abandonRate as number) * 100);
      const count = Number(ctx.count ?? 3);
      return {
        headline: `You've done this ${count} times in "${cat}".`,
        body: `${rate}% of those purchases ended up unused. The pattern is the warning — not the price tag.`,
        source: 'template',
      };
    }
    case 'W4_FRIEND_WARNING': {
      const place = (ctx.place as { name?: string; distance?: number } | undefined);
      const r = ctx.rating as { avgFriendRating?: number; friendCount?: number } | undefined;
      return {
        headline: `Your circle is not vouching for ${place?.name ?? 'this place'}.`,
        body: `${r?.friendCount ?? 3} people in your network rated it ${(r?.avgFriendRating ?? 2.5).toFixed(1)}/5. ${place?.distance ?? 200}m doesn't have to mean tonight.`,
        source: 'template',
      };
    }
    case 'W5_BETTER_RESTAURANT': {
      const cur = ctx.current as { name?: string } | undefined;
      const better = ctx.better as { name?: string; returnRate?: number } | undefined;
      const dist = Number(ctx.betterDistance ?? 200);
      return {
        headline: `${better?.name ?? 'Your favorite'} is ${dist}m away.`,
        body: `You return to ${better?.name ?? 'it'} ${Math.round((better?.returnRate ?? 0.8) * 100)}% of the time. The new spot at ${cur?.name ?? 'the corner'} hasn't earned that yet.`,
        source: 'template',
      };
    }
    case 'W6_SIMILAR_DISAPPOINTMENT': {
      const cat = String(ctx.category ?? 'this category');
      const bad = ctx.badPurchases as { merchant?: string }[] | undefined;
      const recent = bad?.[bad.length - 1]?.merchant ?? 'similar items';
      return {
        headline: `The last few like this didn't stick.`,
        body: `Two recent "${cat}" purchases — most recent from ${recent} — were returned or barely used. Worth pausing before another.`,
        source: 'template',
      };
    }
    case 'P1_SEASONAL_GAP': {
      const item = String(ctx.item ?? 'seasonal gear');
      const months = Number(ctx.monthsSince ?? 24);
      const store = ctx.store as { name?: string; distance?: number } | undefined;
      const lastClause = months ? `${months} months since your last ${item}.` : `No ${item} in your history.`;
      return {
        headline: `It's been a while, ${firstName}.`,
        body: `${lastClause} ${store?.name ?? 'A relevant store'} is ${store?.distance ?? 400}m away — good moment.`,
        source: 'template',
      };
    }
    case 'P2_DORMANT_INTEREST': {
      const search = ctx.search as { query?: string } | undefined;
      const days = Number(ctx.daysAgo ?? 45);
      const store = ctx.store as { name?: string; distance?: number } | undefined;
      return {
        headline: `You looked into "${search?.query ?? 'this'}" ${days} days ago.`,
        body: `Never bought, never closed the loop. ${store?.name ?? 'A store nearby'} carries it — ${store?.distance ?? 300}m away if you want to settle it.`,
        source: 'template',
      };
    }
    case 'P3_NEW_VERSION': {
      const item = ctx.item as { merchant?: string } | undefined;
      const months = Number(ctx.monthsOld ?? 24);
      const store = ctx.store as { name?: string; distance?: number } | undefined;
      return {
        headline: `Your ${item?.merchant ?? 'device'} is ${months} months old.`,
        body: `${store?.name ?? 'The store'} is ${store?.distance ?? 500}m away and likely carries the new model. No pressure — just a heads-up.`,
        source: 'template',
      };
    }
    case 'P4_HEALTH_GOAL': {
      const goals = (ctx.goals as string[] | undefined) ?? [];
      const steps = Number(ctx.steps ?? 5500);
      const gym = ctx.gym as { name?: string; distance?: number } | undefined;
      const goalsLine = goals.slice(0, 2).filter(Boolean).join(', ');
      return {
        headline: `${gym?.name ?? 'A gym'} is ${gym?.distance ?? 300}m away.`,
        body: `Your stated goals${goalsLine ? ` (${goalsLine})` : ''} and ${steps} steps/day suggest now is the moment — and unlike past tries, the data says you'll stick this time.`,
        source: 'template',
      };
    }
    case 'P5_LOYAL_SPOT': {
      const place = ctx.place as { name?: string; visitCount?: number; returnRate?: number } | undefined;
      const dist = Number(ctx.distance ?? 200);
      return {
        headline: `${place?.name ?? 'Your favorite'} is ${dist}m away.`,
        body: `You've been ${place?.visitCount ?? 6} times — return rate ${Math.round((place?.returnRate ?? 0.8) * 100)}%. It's been a while. Good night for it?`,
        source: 'template',
      };
    }
    default:
      return {
        headline: scenario.scenarioName,
        body: scenario.evidencePoints.join(' • '),
        source: 'template',
      };
  }
}

// ─── Optional Anthropic generator ─────────────────────────────────────────

async function claudeGenerate(
  scenario: ScenarioResultTriggered,
  user: NewnalUserProfile,
): Promise<GeneratedProposal> {
  // Lazy import so the SDK isn't required at build-time when no key is set.
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic();
  const prompt = `You are writing a micro-notification for the Newnal phone.
Scenario: ${scenario.scenarioName} (${scenario.scenarioType})
Evidence: ${scenario.evidencePoints.join(' | ')}
User: ${user.displayName}, age ${user.profileSnapshot.age}, location ${user.profileSnapshot.location}, persona ${user.profileSnapshot.persona}, goal ${user.profileSnapshot.goal}
Context: ${JSON.stringify(scenario.proposalContext)}

Write a proposal card with:
- headline: one punchy sentence, max 8 words. Direct, personal, data-backed. No fluff.
- body: 2 short sentences max. Cite the specific data point. End with an implicit question or open loop.

Rules:
- Never sound like an ad
- Sound like a wise friend who knows your data
- Warning scenarios: honest but kind, not preachy
- Nudge scenarios: encouraging but not pushy
- Use first-person "you" language
- Never use exclamation marks

Return ONLY valid JSON: {"headline": "...", "body": "..."}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = response.content[0];
  const text = block && block.type === 'text' ? block.text : '{}';
  const cleaned = text.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(cleaned) as { headline?: string; body?: string };
  return {
    headline: parsed.headline ?? scenario.scenarioName,
    body: parsed.body ?? scenario.evidencePoints.join(' '),
    source: 'claude',
  };
}

export async function generateProposal(
  scenario: ScenarioResultTriggered,
  user: NewnalUserProfile,
): Promise<GeneratedProposal> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await claudeGenerate(scenario, user);
    } catch (e) {
      // If Claude fails for any reason fall back to the template.
      console.warn('Claude proposal generation failed, falling back to template:', e);
    }
  }
  return templateFor(scenario, user);
}

// Sync version for when we already have everything we need (used in pages
// that pre-render server-side without awaiting an LLM call).
export function generateProposalSync(
  scenario: ScenarioResultTriggered,
  user: NewnalUserProfile,
): GeneratedProposal {
  return templateFor(scenario, user);
}
