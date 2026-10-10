import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { verifyCredentials } from "./server/services/users";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: (credentials) => verifyCredentials(credentials),
    }),
  ],
  logger: {
    // A wrong password is expected user behaviour, not a server error.
    error(error) {
      if (error instanceof CredentialsSignin) return;
      console.error(error);
    },
  },
});

export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
