import { NextResponse } from 'next/server';

export interface ApiErrorShape {
  error: string;
  requestId?: string;
  retryAfterSeconds?: number;
}

export function getRequestId(request: Request) {
  return (
    request.headers.get('cf-ray') ??
    request.headers.get('x-request-id') ??
    `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );
}

export function jsonError(
  message: string,
  status = 400,
  extras?: Partial<Omit<ApiErrorShape, 'error'>>
) {
  return NextResponse.json(
    {
      error: message,
      ...(extras ?? {}),
    },
    { status }
  );
}

export function jsonOk<T extends Record<string, unknown>>(payload: T, status = 200) {
  return NextResponse.json(payload, { status });
}

export async function readJsonBody<T>(request: Request) {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

interface ReadStringOptions {
  field: string;
  min?: number;
  max?: number;
  allowEmpty?: boolean;
}

export function readString(
  value: unknown,
  options: ReadStringOptions
): { value: string; error?: string } {
  if (typeof value !== 'string') {
    return {
      value: '',
      error: `${options.field} must be a string.`,
    };
  }

  const normalized = value.trim();

  if (!options.allowEmpty && normalized.length === 0) {
    return {
      value: normalized,
      error: `${options.field} is required.`,
    };
  }

  if (typeof options.min === 'number' && normalized.length < options.min) {
    return {
      value: normalized,
      error: `${options.field} must be at least ${options.min} characters.`,
    };
  }

  if (typeof options.max === 'number' && normalized.length > options.max) {
    return {
      value: normalized,
      error: `${options.field} must be at most ${options.max} characters.`,
    };
  }

  return { value: normalized };
}

export function readOptionalUrl(value: unknown, field: string) {
  if (typeof value !== 'string') {
    return { value: null as string | null, error: undefined as string | undefined };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { value: null as string | null, error: undefined as string | undefined };
  }

  try {
    const parsed = new URL(normalized);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { value: null, error: `${field} must use http or https.` };
    }

    return { value: normalized, error: undefined };
  } catch {
    return { value: null, error: `${field} must be a valid URL.` };
  }
}
