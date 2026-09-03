import { getToken, encode, decode } from "next-auth/jwt";

// Mobile tokens are Auth.js-format JWTs but salted independently of the web
// session cookie's name, so encoding/decoding them never depends on cookie
// naming details (which differ between dev and prod's secure-cookie prefix).
const MOBILE_TOKEN_SALT = "englishly-mobile-token";
const MOBILE_TOKEN_MAX_AGE = 60 * 60 * 24 * 90; // 90 days — mobile users shouldn't have to re-login often

function requireSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}

export async function issueMobileToken(userId: string): Promise<string> {
  return encode({
    token: { userId },
    secret: requireSecret(),
    salt: MOBILE_TOKEN_SALT,
    maxAge: MOBILE_TOKEN_MAX_AGE,
  });
}

// Resolves the signed-in user's id from either source: a web session cookie
// (getToken derives the right salt from the cookie name automatically), or
// a mobile Bearer token issued by issueMobileToken above. Returns null if
// neither is present/valid — callers should treat that as unauthenticated.
export async function getSessionUserId(request: Request): Promise<string | null> {
  const secret = requireSecret();

  const webToken = await getToken({ req: request, secret });
  if (typeof webToken?.userId === "string") return webToken.userId;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const raw = authHeader.slice("Bearer ".length);
    try {
      const payload = await decode({ token: raw, secret, salt: MOBILE_TOKEN_SALT });
      if (typeof payload?.userId === "string") return payload.userId;
    } catch {
      return null;
    }
  }

  return null;
}
