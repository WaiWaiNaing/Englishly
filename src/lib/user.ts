import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

const DEFAULT_EMAIL = process.env.DEFAULT_USER_EMAIL ?? "me@englishly.local";

// Day-3 auth is deliberately out of scope for the MVP — single user for now.
// Swap this for a real session lookup once auth is wired up.
export async function getOrCreateDefaultUser() {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, DEFAULT_EMAIL),
  });
  if (existing) return existing;

  // Two concurrent cold-start requests can both miss the check above and
  // race to insert — onConflictDoNothing + re-select makes this safe rather
  // than letting the loser crash on the unique email constraint.
  const [created] = await db
    .insert(users)
    .values({ email: DEFAULT_EMAIL })
    .onConflictDoNothing({ target: users.email })
    .returning();
  if (created) return created;

  const winner = await db.query.users.findFirst({
    where: eq(users.email, DEFAULT_EMAIL),
  });
  if (!winner) throw new Error("Failed to create or find default user");
  return winner;
}
