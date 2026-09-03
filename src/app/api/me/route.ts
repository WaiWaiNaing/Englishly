import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUserId } from "@/lib/session";

// Used by the mobile app on launch to validate a stored token and refresh
// the cached profile (web doesn't need this — the session cookie already
// carries the user info via NextAuth's session() callback).
export async function GET(request: Request) {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
  });
}
