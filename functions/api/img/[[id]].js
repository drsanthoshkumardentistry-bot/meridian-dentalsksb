// Cloudflare Pages Function: /api/img/<id>. Needs an R2 bucket bound as IMAGES (see wrangler.toml). Until then it answers 503.
import { handleImg } from "../../../api/_lib/imgCore.js";
import { lookupUser } from "../../../api/_lib/loginAlertCore.js";

export const onRequest = async ({ request, env, params }) => {
  const g = globalThis;
  g.process = g.process || { env: {} };
  g.process.env = g.process.env || {};
  for (const [k, v] of Object.entries(env || {})) if (typeof v === "string") g.process.env[k] = v;
  const auth = request.headers.get("authorization") || "";
  const id = Array.isArray(params.id) ? params.id.join("/") : params.id || "";
  const body = request.method === "PUT" ? await request.arrayBuffer() : null;
  const cap = Number(env.IMG_CLINIC_CAP_BYTES) || undefined;
  const r = await handleImg({ method: request.method, id, token: auth.startsWith("Bearer ") ? auth.slice(7) : "", contentType: request.headers.get("content-type") || "", body, bucket: env.IMAGES, lookup: (t) => lookupUser(t), cap });
  return new Response(r.body, { status: r.status, headers: r.headers });
};
