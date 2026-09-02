import { db } from "@/db";
import { organizations } from "@/db/schema";

const DEFAULT_ORG_NAME = "My Business";

// Single default org for the knowledge-base demo — swap for real org
// creation/selection once multi-tenant auth exists. No race-guard here
// (unlike getOrCreateDefaultUser): this is single-demo-user scale, so a
// concurrent double-create is a non-issue worth accepting rather than
// adding a unique constraint + onConflict just for this.
export async function getOrCreateDefaultOrg() {
  const existing = await db.query.organizations.findFirst();
  if (existing) return existing;

  const [created] = await db
    .insert(organizations)
    .values({ name: DEFAULT_ORG_NAME })
    .returning();
  return created;
}
