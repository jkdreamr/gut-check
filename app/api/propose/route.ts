// app/api/propose/route.ts — fire a proposal to the user's Newnal phone.
//
// POST body extends ProposalPayload with optional template fields:
//   { ..., useTemplate?: boolean,
//          uiTemplatePresetKey?: string,
//          backgroundImageUrl?: string,
//          voiceUrl?: string }
// When useTemplate is true (default), we use /circle/template with the
// "official.admin.update.notice" preset (placeholders `Simple Text0-headline`
// and `Simple Text0-body`). Otherwise we use /circle/simple.

import { NextResponse, type NextRequest } from 'next/server';
import {
  DEFAULT_TEMPLATE_PRESET_KEY,
  sendSimpleCircle,
  sendTemplateCircle,
} from '@/lib/newnal';
import { prisma } from '@/lib/prisma';
import type { ProposalPayload } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ExtendedProposalPayload extends ProposalPayload {
  useTemplate?: boolean;
  uiTemplatePresetKey?: string;
  backgroundImageUrl?: string;
  voiceUrl?: string;
}

export async function POST(req: NextRequest) {
  let body: ExtendedProposalPayload;
  try {
    body = (await req.json()) as ExtendedProposalPayload;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const required: (keyof ProposalPayload)[] = ['userId', 'scenarioId', 'scenarioName', 'scenarioType', 'headline', 'body'];
  for (const key of required) {
    if (!body[key]) return NextResponse.json({ error: `${key} required` }, { status: 400 });
  }

  const isDemo = body.userId.startsWith('demo:');
  const useTemplate = body.useTemplate ?? true;

  let circleId: string | null = null;
  let success = true;
  let raw: string | null = null;
  let error: string | undefined;

  if (!isDemo) {
    try {
      if (useTemplate) {
        const result = await sendTemplateCircle({
          target_personal_ai_did: body.userId,
          circle_title: body.headline.slice(0, 200),
          ui_template_preset_key: body.uiTemplatePresetKey ?? DEFAULT_TEMPLATE_PRESET_KEY,
          ui_template_placeholders: {
            'Simple Text0-headline': body.headline,
            'Simple Text0-body': body.body,
          },
          ...(body.backgroundImageUrl ? { circle_background_image_url: body.backgroundImageUrl } : {}),
          ...(body.voiceUrl ? { circle_title_voice_url: body.voiceUrl } : {}),
        });
        circleId = result.circle_id;
        success = result.success;
        error = result.error;
        raw = JSON.stringify(result);
      } else {
        const result = await sendSimpleCircle({
          target_personal_ai_did: body.userId,
          circle_title: body.headline.slice(0, 200),
          text_message: body.body,
        });
        circleId = result.circle_id;
        success = result.success;
        error = result.error;
        raw = JSON.stringify(result);
      }
    } catch (e) {
      success = false;
      error = e instanceof Error ? e.message : String(e);
    }
  } else {
    circleId = `demo-${Date.now().toString(36)}`;
    raw = JSON.stringify({ demo: true });
  }

  const log = await prisma.proposalLog.create({
    data: {
      userId: body.userId,
      userName: body.userName ?? body.userId,
      scenarioId: body.scenarioId,
      scenarioName: body.scenarioName,
      scenarioType: body.scenarioType,
      confidence: body.confidence ?? 0.5,
      headline: body.headline,
      body: body.body,
      evidence: JSON.stringify(body.evidence ?? []),
      newnalCircleId: circleId,
      newnalResponse: raw,
    },
  });

  return NextResponse.json({ success, circleId, error, log });
}
