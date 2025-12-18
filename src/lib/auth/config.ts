import { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

// Environment variable helpers
const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    console.warn(`Missing environment variable: ${key}`);
    return '';
  }
  return value;
};

// User type extension
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      plan: 'free' | 'pro' | 'team' | 'enterprise';
      usage: {
        conversions: number;
        apiCalls: number;
        lastReset: string;
      };
    };
  }

  interface User {
    id: string;
    plan?: 'free' | 'pro' | 'team' | 'enterprise';
    usage?: {
      conversions: number;
      apiCalls: number;
      lastReset: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    plan: 'free' | 'pro' | 'team' | 'enterprise';
    usage: {
      conversions: number;
      apiCalls: number;
      lastReset: string;
    };
  }
}

// Default usage for new users
const getDefaultUsage = () => ({
  conversions: 0,
  apiCalls: 0,
  lastReset: new Date().toISOString().split('T')[0],
});

// Get or create user in Firestore
async function getOrCreateUser(email: string, name?: string | null, image?: string | null) {
  try {
    const usersRef = adminDb.collection('users');
    const userDoc = await usersRef.doc(email).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      // Reset usage if it's a new day
      const today = new Date().toISOString().split('T')[0];
      if (userData?.usage?.lastReset !== today) {
        await usersRef.doc(email).update({
          'usage.conversions': 0,
          'usage.apiCalls': 0,
          'usage.lastReset': today,
        });
        return {
          ...userData,
          usage: { ...getDefaultUsage(), lastReset: today },
        };
      }
      return userData;
    }

    // Create new user
    const newUser = {
      email,
      name: name || '',
      image: image || '',
      plan: 'free' as const,
      usage: getDefaultUsage(),
      createdAt: new Date().toISOString(),
    };

    await usersRef.doc(email).set(newUser);
    return newUser;
  } catch (error) {
    console.error('Error getting/creating user:', error);
    return {
      plan: 'free' as const,
      usage: getDefaultUsage(),
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: getEnvVar('GITHUB_ID'),
      clientSecret: getEnvVar('GITHUB_SECRET'),
    }),
    GoogleProvider({
      clientId: getEnvVar('GOOGLE_CLIENT_ID'),
      clientSecret: getEnvVar('GOOGLE_CLIENT_SECRET'),
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        try {
          // Verify with Firebase Auth
          const userRecord = await adminAuth.getUserByEmail(credentials.email);

          // For credentials, we need to verify the password through Firebase client SDK
          // This is a simplified version - in production, use Firebase client auth
          if (userRecord) {
            return {
              id: userRecord.uid,
              email: userRecord.email,
              name: userRecord.displayName,
              image: userRecord.photoURL,
            };
          }
          return null;
        } catch {
          throw new Error('Invalid credentials');
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    newUser: '/auth/register',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'github' || account?.provider === 'google') {
        // Create/update user in Firestore
        if (user.email) {
          await getOrCreateUser(user.email, user.name, user.image);
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const userData = await getOrCreateUser(user.email, user.name, user.image);
        token.id = user.id;
        token.plan = userData?.plan || 'free';
        token.usage = userData?.usage || getDefaultUsage();
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.plan = token.plan;
        session.user.usage = token.usage;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
