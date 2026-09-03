import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

interface Profile {
  email: string;
  name?: string | null;
  image?: string | null;
}

// Shared by the web OAuth callback (auth.ts) and the mobile token exchange
// (api/auth/mobile) so both sign-in paths use the same race-safe upsert.
export async function upsertUserByEmail(profile: Profile) {
  const existing = await db.query.users.findFirst({ where: eq(users.email, profile.email) });
  if (existing) return existing;

  const [inserted] = await db
    .insert(users)
    .values({ email: profile.email, name: profile.name, image: profile.image })
    .onConflictDoNothing({ target: users.email })
    .returning();
  if (inserted) return inserted;

  const winner = await db.query.users.findFirst({ where: eq(users.email, profile.email) });
  if (!winner) throw new Error("Failed to create or find user");
  return winner;
}
