// Runs the existing Vercel-style handlers (api/*.js) on Cloudflare Pages Functions without changing them.
// A handler gets a Node-like req (method, headers, body) and res (statusCode, setHeader, end).
export const adapt = (handler) => async ({ request, env }) => {
  // The handlers read keys from process.env, so copy the Cloudflare variables there.
  const g = globalThis;
  g.process = g.process || { env: {} };
  g.process.env = g.process.env || {};
  for (const [k, v] of Object.entries(env || {})) if (typeof v === "string") g.process.env[k] = v;

  const headers = {};
  request.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
  const text = request.method === "GET" || request.method === "HEAD" ? "" : await request.text();
  if (text.length > 60000) return new Response(JSON.stringify({ error: "Request too large." }), { status: 413, headers: { "Content-Type": "application/json" } });
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = {}; }

  return new Promise((resolve) => {
    const out = new Headers();
    const res = {
      statusCode: 200,
      setHeader: (k, v) => out.set(k, String(v)),
      end: (data) => resolve(new Response(data === undefined || data === "" ? null : data, { status: res.statusCode, headers: out })),
    };
    Promise.resolve(handler({ method: request.method, headers, body }, res)).catch(() => {
      resolve(new Response(JSON.stringify({ error: "Server error." }), { status: 500, headers: { "Content-Type": "application/json" } }));
    });
  });
};
