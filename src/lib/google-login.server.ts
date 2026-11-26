import { googleLoginBridgeUrl, isAllowedLoginOrigin, loginRedirectUri } from "./google-login";

type Send = typeof fetch;
export class GoogleLoginError extends Error {}

function requestOrigin(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  let origin = `${url.protocol}//${host}`;
  if (host === "goldcenterstr.com" || host === "www.goldcenterstr.com") origin = `https://${host}`;
  if (!isAllowedLoginOrigin(origin)) {
    const proto = request.headers.get("x-forwarded-proto") ?? "https";
    origin = `${proto}://${host}`;
  }
  if (!isAllowedLoginOrigin(origin)) throw new GoogleLoginError("هذا الدومين غير مسموح له بالدخول بـ Google.");
  return origin;
}

async function publicConfig(send: Send) {
  const url = process.env["SUPABASE_URL"]; const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new GoogleLoginError("إعدادات الموقع غير مكتملة على هذه الاستضافة.");
  const res = await send(`${url}/rest/v1/rpc/public_google_login`, { method: "POST", headers: { apikey: key, "Content-Type": "application/json" }, body: "{}" });
  if (!res.ok) throw new GoogleLoginError("تعذر قراءة إعدادات Google.");
  const rows = await res.json() as { client_id: string; enabled: boolean }[];
  return rows[0] ?? { client_id: "", enabled: false };
}

/** Exchanges a Google code for a one-time sign-in token. Runs only where the private key exists (Lovable). */
export async function exchangeGoogleCode(code: string, redirectUri: string, send: Send = fetch) {
  const origin = new URL(redirectUri).origin;
  if (redirectUri !== loginRedirectUri(origin)) throw new GoogleLoginError("رابط العودة غير مسموح.");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: cfg } = await supabaseAdmin.from("google_login_config").select("client_id, client_secret, enabled").eq("id", 1).single();
  if (!cfg?.enabled || !cfg.client_id || !cfg.client_secret) throw new GoogleLoginError("الدخول بـ Google غير مفعّل من لوحة التحكم.");
  const tokenRes = await send("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: cfg.client_id, client_secret: cfg.client_secret, redirect_uri: redirectUri, grant_type: "authorization_code" }) });
  const token = await tokenRes.json() as { id_token?: string; error?: string; error_description?: string };
  if (!tokenRes.ok || !token.id_token) throw new GoogleLoginError(`رفض Google الطلب: ${token.error_description ?? token.error ?? tokenRes.status}`);
  const infoRes = await send(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token.id_token)}`);
  const info = await infoRes.json() as { aud?: string; iss?: string; email?: string; email_verified?: string | boolean; name?: string; picture?: string; exp?: string };
  const verified = info.email_verified === true || info.email_verified === "true";
  if (!infoRes.ok || info.aud !== cfg.client_id || !["accounts.google.com", "https://accounts.google.com"].includes(info.iss ?? "") || !info.email || !verified || Number(info.exp ?? 0) * 1000 < Date.now()) {
    throw new GoogleLoginError("تعذر التحقق من حساب Google.");
  }
  const email = info.email.toLowerCase();
  const created = await supabaseAdmin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { full_name: info.name, avatar_url: info.picture } });
  if (created.error && !/already|registered|exists/i.test(created.error.message)) throw new GoogleLoginError("تعذر إنشاء الحساب.");
  const link = await supabaseAdmin.auth.admin.generateLink({ type: "magiclink", email });
  const hash = link.data.properties?.hashed_token;
  if (link.error || !hash) throw new GoogleLoginError("تعذر إكمال الدخول.");
  return hash;
}

async function relayExchange(code: string, redirectUri: string, send: Send) {
  const res = await send(googleLoginBridgeUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, redirect_uri: redirectUri }), redirect: "manual", signal: AbortSignal.timeout(20000) });
  const body = await res.json().catch(() => ({})) as { token_hash?: string; error?: string };
  if (!res.ok || !body.token_hash) throw new GoogleLoginError(body.error ?? "تعذر الاتصال بخدمة الدخول؛ تأكد أن نسخة Lovable منشورة.");
  return body.token_hash;
}

const cookieName = "gc_google_state";
const back = (origin: string, params: Record<string, string>) => new Response(null, { status: 302, headers: { Location: `${origin}/auth/callback?${new URLSearchParams(params)}`, "Cache-Control": "no-store", "Set-Cookie": `${cookieName}=; Path=/api/public/google-login; Max-Age=0; HttpOnly; Secure; SameSite=Lax` } });

export async function handleGoogleLoginGet(request: Request, send: Send = fetch): Promise<Response> {
  let origin = "";
  try {
    origin = requestOrigin(request);
    const url = new URL(request.url);
    const redirectUri = loginRedirectUri(origin);
    if (url.searchParams.get("start") === "1") {
      const cfg = await publicConfig(send);
      if (!cfg.enabled) return back(origin, { error_description: "الدخول بـ Google غير مفعّل من لوحة التحكم." });
      const state = crypto.randomUUID();
      const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      google.search = new URLSearchParams({ client_id: cfg.client_id, redirect_uri: redirectUri, response_type: "code", scope: "openid email profile", prompt: "select_account", state }).toString();
      return new Response(null, { status: 302, headers: { Location: google.href, "Cache-Control": "no-store", "Set-Cookie": `${cookieName}=${state}; Path=/api/public/google-login; Max-Age=600; HttpOnly; Secure; SameSite=Lax` } });
    }
    const err = url.searchParams.get("error");
    if (err) return back(origin, { error_description: err === "access_denied" ? "تم إلغاء الدخول من Google." : err });
    const code = url.searchParams.get("code"); const state = url.searchParams.get("state");
    const saved = (request.headers.get("cookie") ?? "").split(/;\s*/).find(c => c.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    if (!code || !state || !saved || state !== saved) return back(origin, { error_description: "انتهت صلاحية طلب الدخول؛ حاول مرة أخرى." });
    const hash = process.env["HOSTED_ADMIN_BRIDGE_URL"] ? await relayExchange(code, redirectUri, send) : await exchangeGoogleCode(code, redirectUri, send);
    return back(origin, { token_hash: hash, type: "magiclink" });
  } catch (e) {
    const message = e instanceof GoogleLoginError ? e.message : "تعذر الدخول بـ Google؛ حاول مرة أخرى.";
    if (!origin) return new Response(message, { status: 400 });
    return back(origin, { error_description: message });
  }
}

export async function handleGoogleLoginPost(request: Request, send: Send = fetch): Promise<Response> {
  try {
    const body = await request.json() as { code?: unknown; redirect_uri?: unknown };
    if (typeof body.code !== "string" || typeof body.redirect_uri !== "string" || body.code.length > 2000) throw new GoogleLoginError("طلب غير صالح.");
    return Response.json({ token_hash: await exchangeGoogleCode(body.code, body.redirect_uri, send) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return Response.json({ error: e instanceof GoogleLoginError ? e.message : "تعذر الدخول بـ Google." }, { status: 400 });
  }
}
