// ── Session utility — Web Crypto HMAC-SHA256 (Edge + Node.js compatible, no Buffer) ──

export interface SessionPayload {
    id: string;
    email: string;
    fullName: string;
    role: string;
    exp: number;
}

// ประกาศตัวแปรเพื่อลดโอกาสที่ TypeScript จะขึ้นขีดแดงเตือน
declare const process: any;

const SECRET = process.env.AUTH_SECRET ?? "my-super-secret-key";
export const COOKIE_NAME = "admin_session";
export const SESSION_DAYS = 7;

// ── base64url helpers (no Buffer / no Node.js required) ──────────────────────
function toBase64Url(bytes: Uint8Array): string {
    // Convert to binary string in chunks to avoid stack overflow
    let binary = "";
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function fromBase64Url(b64url: string): Uint8Array {
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function strToBase64Url(s: string): string {
    return toBase64Url(enc.encode(s));
}

function base64UrlToStr(b64url: string): string {
    return dec.decode(fromBase64Url(b64url));
}

// ── Crypto helpers ────────────────────────────────────────────────────────────
async function importKey(secret: string): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        "raw", enc.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false, ["sign", "verify"]
    );
}

async function hmacSign(data: string, secret: string): Promise<string> {
    const key = await importKey(secret);
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
    return toBase64Url(new Uint8Array(sig));
}

async function hmacVerify(data: string, sig: string, secret: string): Promise<boolean> {
    const key = await importKey(secret);
    return crypto.subtle.verify("HMAC", key, fromBase64Url(sig) as any, enc.encode(data));
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Create a signed session token: base64url(payload).hmac */
export async function createSessionToken(
    payload: Omit<SessionPayload, "exp">
): Promise<string> {
    const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * SESSION_DAYS;
    const data = strToBase64Url(JSON.stringify({ ...payload, exp }));
    const sig = await hmacSign(data, SECRET);
    return `${data}.${sig}`;
}

/** Verify token — returns payload or null */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
    try {
        const dot = token.lastIndexOf(".");
        if (dot === -1) return null;
        const data = token.slice(0, dot);
        const sig = token.slice(dot + 1);

        const valid = await hmacVerify(data, sig, SECRET);
        if (!valid) return null;

        const payload = JSON.parse(base64UrlToStr(data)) as SessionPayload;
        if (payload.exp < Math.floor(Date.now() / 1000)) return null;
        return payload;
    } catch {
        return null;
    }
}