import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUserByEmail } from "@/lib/upsertUser";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await upsertUserByEmail({
          email: user.email,
          name: user.name,
          image: user.image,
        });
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
