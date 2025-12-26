import { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { connectDB } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import bcrypt from 'bcryptjs';

// Environment variable helpers - supports both naming conventions
const getEnvVar = (key: string, altKey?: string): string => {
  const value = process.env[key] || (altKey ? process.env[altKey] : undefined);
  if (!value) {
    console.warn(`Missing environment variable: ${key}${altKey ? ` or ${altKey}` : ''}`);
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
      emailVerified: boolean;
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
    emailVerified?: boolean;
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
    emailVerified: boolean;
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

// Get or create user in MongoDB
async function getOrCreateUser(email: string, name?: string | null, image?: string | null) {
  try {
    await connectDB();

    let user = await User.findById(email);

    if (user) {
      // Reset usage if it's a new day
      const today = new Date().toISOString().split('T')[0];
      if (user.usage?.lastReset !== today) {
        user.usage = {
          conversions: 0,
          apiCalls: 0,
          lastReset: today,
        };
        await user.save();
      }
      return user.toObject();
    }

    // Create new user
    user = new User({
      _id: email,
      email,
      name: name || '',
      image: image || '',
      plan: 'free',
      usage: getDefaultUsage(),
    });

    await user.save();
    return user.toObject();
  } catch (error) {
    console.error('Error getting/creating user:', error);
    return {
      email,
      plan: 'free' as const,
      emailVerified: false,
      usage: getDefaultUsage(),
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: getEnvVar('GITHUB_ID', 'AUTH_GITHUB_ID'),
      clientSecret: getEnvVar('GITHUB_SECRET', 'AUTH_GITHUB_SECRET'),
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
          await connectDB();

          // Find user by email
          const user = await User.findById(credentials.email);

          if (!user) {
            throw new Error('No user found with this email');
          }

          // Check password
          if (!user.password) {
            throw new Error('This account uses social login. Please sign in with your provider.');
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValid) {
            throw new Error('Invalid credentials');
          }

          return {
            id: user._id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error('Auth error:', error);
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
        // Create/update user in MongoDB
        if (user.email) {
          await getOrCreateUser(user.email, user.name, user.image);
        }
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user?.email) {
        const userData = await getOrCreateUser(user.email, user.name, user.image);
        token.id = user.id || user.email;
        token.plan = userData?.plan || 'free';
        token.emailVerified = !!userData?.emailVerified;
        token.usage = userData?.usage || getDefaultUsage();
      }
      // Refresh emailVerified on session update
      if (trigger === 'update' && token.id) {
        try {
          await connectDB();
          const userData = await User.findById(token.id);
          if (userData) {
            token.emailVerified = !!userData.emailVerified;
          }
        } catch (error) {
          console.error('Error refreshing emailVerified:', error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.plan = token.plan;
        session.user.emailVerified = token.emailVerified;
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
