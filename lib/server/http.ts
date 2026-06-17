/** Shared HTTP helpers for the serverless functions (mirrors farm-voice-notes/lib/http.ts). */

const CORS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, GET, OPTIONS',
  'access-control-allow-headers': 'content-type, x-onylogy-secret',
};

/** JSON Response with permissive CORS (same-origin in prod; cross-origin for local `vercel dev`). */
export function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...CORS },
  });
}

/** CORS preflight response. */
export function preflight(): Response {
  return new Response(null, { status: 204, headers: CORS });
}

/** Shared-secret gate. If ONYLOGY_SECRET is unset (local dev), allow everything. */
export function authorized(request: Request): boolean {
  const secret = process.env.ONYLOGY_SECRET;
  if (!secret) return true;
  return request.headers.get('x-onylogy-secret') === secret;
}
