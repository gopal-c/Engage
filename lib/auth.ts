import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { sql } from "./db";

const DEV_USERS = [
  { email: "hr@valueaddsofttech.com", password: "demo123", name: "HR Demo", role: "hr" },
  { email: "admin", password: "demo123", name: "Admin Demo", role: "admin" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const providers: any[] = [
  Google({
    clientId: process.env.AUTH_GOOGLE_ID!,
    clientSecret: process.env.AUTH_GOOGLE_SECRET!,
  }),
];

if (process.env.ENABLE_DEV_LOGIN === "true") {
  providers.push(
    Credentials({
      credentials: {
        email: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const match = DEV_USERS.find(
          (u) => u.email === email && u.password === password,
        );
        if (!match) return null;

        const rows = await sql`
          INSERT INTO auth.users (email, name)
          VALUES (${match.email}, ${match.name})
          ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            updated_at = NOW()
          RETURNING id, role
        `;

        if (rows[0].role !== match.role) {
          await sql`UPDATE auth.users SET role = ${match.role} WHERE id = ${rows[0].id}`;
        }

        return {
          id: rows[0].id as string,
          email: match.email,
          name: match.name,
          role: match.role,
        };
      },
    }),
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "credentials") return true;
      if (!profile?.email?.endsWith("@valueaddsofttech.com")) {
        return false;
      }
      return true;
    },
    async jwt({ token, profile, trigger, user }) {
      if (trigger === "signIn") {
        if (profile) {
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
        } else if (user) {
          token.id = user.id;
          token.role = (user as Record<string, unknown>).role as string;
        }
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
