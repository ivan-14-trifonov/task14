import type { NextAuthOptions, Session } from "next-auth"
import { getServerSession } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { redirect } from "next/navigation"

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function isAllowedEmail(email?: string | null) {
  if (!email) return false
  return getAdminEmails().includes(email.toLowerCase())
}

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async jwt({ token }) {
      token.allowed = isAllowedEmail(token.email)
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          allowed: Boolean(token.allowed),
        },
      } as Session
    },
  },
}

export async function requireSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect("/login")
  return session as Session & { user: { email: string; name?: string | null; image?: string | null; allowed?: boolean } }
}

export async function requireAdmin() {
  const session = await requireSession()
  if (!isAllowedEmail(session.user.email)) redirect("/login?error=AccessDenied")
  return session
}
