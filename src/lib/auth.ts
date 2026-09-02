import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        const existing = await db.query.users.findFirst({
          where: eq(users.email, user.email),
        });

        let dbUser = existing;
        if (!dbUser) {
          // Two tabs signing in at once can both miss the check above and
          // race to insert — onConflictDoNothing + re-select makes this
          // safe rather than throwing on the unique email constraint.
          const [inserted] = await db
            .insert(users)
            .values({ email: user.email, name: user.name, image: user.image })
            .onConflictDoNothing({ target: users.email })
            .returning();
          dbUser =
            inserted ??
            (await db.query.users.findFirst({ where: eq(users.email, user.email) }));
        }

        if (!dbUser) throw new Error("Failed to create or find user");
        token.userId = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
});
