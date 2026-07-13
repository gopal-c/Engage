import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { sql } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email?.endsWith("@valueaddsofttech.com")) {
        return false;
      }
      return true;
    },
    async jwt({ token, profile, trigger }) {
      if (trigger === "signIn" && profile) {
        const rows = await sql`
          INSERT INTO auth.users (email, name, avatar_url)
          VALUES (${profile.email!}, ${profile.name!}, ${profile.picture ?? null})
          ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            avatar_url = EXCLUDED.avatar_url,
            updated_at = NOW()
          RETURNING id, role
        `;
        token.id = rows[0].id;
        token.role = rows[0].role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard && !isLoggedIn) return false;
      return true;
    },
  },
});
