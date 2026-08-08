/**
 * Saubhagya – Instagram feed (Cloudflare Pages Function)
 *
 * GET /api/instagram[?limit=12]
 *   → 200 { status:'ok', posts:[{id,caption,image,permalink,isVideo,timestamp}], count, profile }
 *   → 200 { status:'not_configured', posts:[] }        META_ACCESS_TOKEN unset
 *   → 200 { status:'error', posts:[], error }          Graph API/network failure
 *
 * ALWAYS 200: the homepage calls this on every load, so a broken token or a
 * Meta outage must degrade to an empty section, never a 500.
 *
 * Env: META_ACCESS_TOKEN (secret, needs instagram_basic)
 *      IG_USER_ID (default = the saubhagyajewellery_ IG Business account)
 *
 * Responses are held in the Workers edge cache for 30 min — the Graph API is
 * rate-limited per token and must not be hit once per pageview. Only successful
 * responses are cached (an empty `posts` array IS success: media_count is 0
 * until the owner posts).
 */

const IG_USER_ID_DEFAULT = '17841443636393065';
const PROFILE_URL = 'https://www.instagram.com/saubhagyajewellery_/';
const GRAPH_VERSION = 'v22.0';
const FIELDS = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp';
const TTL = 1800; // 30 min
const CAPTION_MAX = 140;

export async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  const json = (obj, cacheable = false) => new Response(JSON.stringify(obj), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      // no-store on the degraded paths so a missing token / transient Meta
      // failure isn't frozen at the edge for 30 min.
      'Cache-Control': cacheable ? `public, max-age=${TTL}, s-maxage=${TTL}` : 'no-store',
      ...corsHeaders,
    },
  });

  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (request.method !== 'GET') return json({ status: 'error', posts: [], error: 'Method not allowed' });

  const token = env.META_ACCESS_TOKEN;
  if (!token) return json({ status: 'not_configured', posts: [] });

  const igUserId = env.IG_USER_ID || IG_USER_ID_DEFAULT;
  const url = new URL(request.url);
  const limit = Math.min(24, Math.max(1, parseInt(url.searchParams.get('limit'), 10) || 12));

  // Cache key must be stable and token-free: same origin+path+limit for every
  // visitor, so one Graph call serves the whole colo for TTL.
  const cacheKey = new Request(`${url.origin}/api/instagram?limit=${limit}`, { method: 'GET' });
  const cache = caches.default;

  try {
    const hit = await cache.match(cacheKey);
    if (hit) {
      const res = new Response(hit.body, hit); // headers are immutable on a cache hit
      res.headers.set('X-IG-Cache', 'HIT');
      return res;
    }
  } catch (e) { /* cache unavailable (local dev) — fall through to a live fetch */ }

  let payload;
  try {
    const api = `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(igUserId)}/media`
      + `?fields=${FIELDS}&limit=${limit}&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(api, {
      headers: { Accept: 'application/json' },
      signal: (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) ? AbortSignal.timeout(6000) : undefined,
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.error) {
      // Never echo the token or the full Graph envelope back to the browser.
      const detail = String((data.error && data.error.message) || `graph ${res.status}`).slice(0, 200);
      return json({ status: 'error', posts: [], error: detail });
    }
    if (!Array.isArray(data.data)) return json({ status: 'error', posts: [], error: 'unexpected graph response' });

    const posts = data.data.map(m => {
      const type = String(m.media_type || '').toUpperCase();
      const isVideo = type === 'VIDEO' || type === 'REEL' || type === 'REELS';
      // VIDEO/REEL media_url is an .mp4 — thumbnail_url is the only usable still.
      const image = m.thumbnail_url || m.media_url || '';
      const cap = String(m.caption || '').replace(/\s+/g, ' ').trim();
      return {
        id: String(m.id || ''),
        caption: cap.length > CAPTION_MAX ? cap.slice(0, CAPTION_MAX - 1) + '…' : cap,
        image,
        // Real .mp4 for VIDEO/REEL so the grid can play it inline on hover.
        video: isVideo ? (m.media_url || '') : '',
        permalink: m.permalink || PROFILE_URL,
        isVideo,
        timestamp: m.timestamp || null,
      };
    }).filter(p => p.id && p.image);

    payload = { status: 'ok', posts, count: posts.length, profile: PROFILE_URL };
  } catch (err) {
    return json({ status: 'error', posts: [], error: String(err.message || err).slice(0, 200) });
  }

  // Empty posts is the expected launch state, so it caches like any other hit.
  const out = json(payload, true);
  out.headers.set('X-IG-Cache', 'MISS');
  try {
    // clone(): a Response body can only be read once — cache.put consumes it.
    const job = cache.put(cacheKey, out.clone());
    if (context.waitUntil) context.waitUntil(job); else await job;
  } catch (e) { /* caching is best-effort — never fail the request over it */ }
  return out;
}
