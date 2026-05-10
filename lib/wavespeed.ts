import type { ScenarioType } from './types';

const DEFAULT_BASE_URL = 'https://llm.wavespeed.ai/v1';
const DEFAULT_MODEL = 'bytedance-seed/seed-1.6-flash';

interface WaveSpeedMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface WaveSpeedJsonOptions {
  system: string;
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

interface WaveSpeedResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  error?: {
    message?: string;
  };
}

type WaveSpeedContent = string | Array<{ type?: string; text?: string }> | undefined;

export function hasWaveSpeed() {
  return Boolean(process.env.WAVESPEED_API_KEY?.trim());
}

export function waveSpeedBaseUrl() {
  return process.env.WAVESPEED_BASE_URL?.trim() || DEFAULT_BASE_URL;
}

export function waveSpeedModel() {
  return process.env.WAVESPEED_MODEL?.trim() || DEFAULT_MODEL;
}

export function recommendedWaveSpeedModel(type: ScenarioType) {
  if (type === 'warning') return waveSpeedModel();
  return waveSpeedModel();
}

function extractTextContent(content: WaveSpeedContent) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((block) => block?.text ?? '')
      .join('\n')
      .trim();
  }
  return '';
}

function stripJsonFences(text: string) {
  return text.replace(/```json|```/gi, '').trim();
}

export async function waveSpeedJson<T>({
  system,
  prompt,
  model,
  temperature = 0.35,
  maxTokens = 1400,
  timeoutMs = 6500,
}: WaveSpeedJsonOptions): Promise<T> {
  const apiKey = process.env.WAVESPEED_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('WAVESPEED_API_KEY is not set');
  }

  const messages: WaveSpeedMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: prompt },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${waveSpeedBaseUrl()}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model ?? waveSpeedModel(),
        messages,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`WaveSpeed request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WaveSpeed request failed: HTTP ${response.status} ${text.slice(0, 300)}`);
  }

  const data = (await response.json()) as WaveSpeedResponse;
  const raw = stripJsonFences(extractTextContent(data.choices?.[0]?.message?.content));
  if (!raw) {
    throw new Error(data.error?.message || 'WaveSpeed returned no JSON content');
  }

  return JSON.parse(raw) as T;
}
