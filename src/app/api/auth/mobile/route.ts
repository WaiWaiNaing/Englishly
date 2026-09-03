import { NextResponse } from "next/server";
import { upsertUserByEmail } from "@/lib/upsertUser";
import { issueMobileToken } from "@/lib/session";

interface GoogleTokenInfo {
  aud: string;
  email: string;
  email_verified: string; // "true" | "false", per Google's tokeninfo response
  name?: string;
  picture?: string;
}

const ALLOWED_CLIENT_IDS = [
  process.env.AUTH_GOOGLE_IOS_CLIENT_ID,
  process.env.AUTH_GOOGLE_ANDROID_CLIENT_ID,
].filter((id): id is string => Boolean(id));

// Mobile can't use the web's cookie-based OAuth redirect flow, so the app
// signs in with Google natively and exchanges the resulting ID token here
// for an Englishly session token (see src/lib/session.ts), sent back as a
// Bearer token on every subsequent API call.
export async function POST(request: Request) {
  if (ALLOWED_CLIENT_IDS.length === 0) {
    return NextResponse.json(
      { error: "Mobile sign-in is not configured (missing Google client IDs)" },
      { status: 500 },
    );
  }

  const body = await request.json().catch(() => null);
  const idToken = typeof body?.idToken === "string" ? body.idToken : "";
  if (!idToken) {
    return NextResponse.json({ error: "idToken is required" }, { status: 400 });
  }

  let info: GoogleTokenInfo;
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );
    if (!res.ok) throw new Error("tokeninfo request failed");
    info = await res.json();
  } catch {
    return NextResponse.json({ error: "Invalid Google ID token" }, { status: 401 });
  }

  if (!ALLOWED_CLIENT_IDS.includes(info.aud)) {
    return NextResponse.json({ error: "Token was not issued for this app" }, { status: 401 });
  }
  if (info.email_verified !== "true" || !info.email) {
    return NextResponse.json({ error: "Email not verified" }, { status: 401 });
  }

  const dbUser = await upsertUserByEmail({
    email: info.email,
    name: info.name ?? null,
    image: info.picture ?? null,
  });

  const token = await issueMobileToken(dbUser.id);

  return NextResponse.json({
    token,
    user: { id: dbUser.id, email: dbUser.email, name: dbUser.name, image: dbUser.image },
  });
}
