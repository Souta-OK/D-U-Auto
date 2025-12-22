import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// Declare global type for warning flag
declare global {
  var __oauthWarningShown: boolean | undefined;
}

// Build providers array conditionally
const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
} else if (!global.__oauthWarningShown) {
  // Only show warning once per process
  console.warn(
    '⚠️  Google OAuth credentials not found. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment variables to enable OAuth authentication.'
  );
  global.__oauthWarningShown = true;
}

export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || !user.email) {
        return false;
      }

      try {
        await connectDB();
        
        // Check if user exists by email
        let dbUser = await User.findOne({ email: user.email });

        if (dbUser) {
          // Update existing user with OAuth info if needed
          if (dbUser.provider !== account.provider || dbUser.providerId !== account.providerAccountId) {
            dbUser.provider = account.provider;
            dbUser.providerId = account.providerAccountId;
            if (user.image) dbUser.image = user.image;
            if (user.name && !dbUser.name) dbUser.name = user.name;
            await dbUser.save();
          }
        } else {
          // Create new user from OAuth
          dbUser = await User.create({
            email: user.email,
            name: user.name || user.email.split('@')[0],
            image: user.image || undefined,
            provider: account.provider,
            providerId: account.providerAccountId,
          });
        }

        // Update user object with database ID
        user.id = dbUser._id.toString();
        return true;
      } catch (error: any) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

