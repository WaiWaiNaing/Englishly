import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organizations, users } from "@/db/schema";

// Each signed-in user gets their own org for their knowledge base, created
// lazily on first use. Kept as a separate org concept (rather than scoping
// knowledge_* directly to userId) so multiple users can share one org later,
// once real multi-user SME accounts exist — but for now it's always 1:1.
export async function getOrCreateOrgForUser(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new Error("User not found");

  if (user.orgId) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, user.orgId),
    });
    if (org) return org;
  }

  const [org] = await db
    .insert(organizations)
    .values({ name: `${user.name ?? user.email}'s Knowledge Base` })
    .returning();
  await db.update(users).set({ orgId: org.id }).where(eq(users.id, userId));

  return org;
}
