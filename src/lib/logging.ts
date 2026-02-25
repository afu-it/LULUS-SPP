export function logApiError(params: {
  requestId?: string;
  route: string;
  method: string;
  error: unknown;
  status?: number;
  meta?: Record<string, unknown>;
}) {
  const payload = {
    level: 'error',
    type: 'api',
    requestId: params.requestId,
    route: params.route,
    method: params.method,
    status: params.status,
    message: extractErrorMessage(params.error),
    meta: params.meta,
    timestamp: new Date().toISOString(),
  };

  console.error(JSON.stringify(payload));
}

function extractErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Unknown error';
}
