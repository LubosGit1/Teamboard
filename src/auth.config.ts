import type { NextAuthConfig } from "next-auth";

const AUTH_PAGES = ["/login", "/register"];

/** Edge-safe config (no DB, no bcrypt) shared by middleware and the full Auth.js setup. */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  // We run behind `next start` / a reverse proxy too, not only on Vercel.
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isSignedIn = Boolean(auth?.user);
      if (nextUrl.pathname.startsWith("/projects")) return isSignedIn;
      if (isSignedIn && AUTH_PAGES.includes(nextUrl.pathname)) {
        return Response.redirect(new URL("/projects", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (typeof token.id === "string") session.user.id = token.id;
      return session;
    },
  },
} satisfies NextAuthConfig;
