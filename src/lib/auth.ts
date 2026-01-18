import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import connectDB from './mongodb';
import User from '@/models/User';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          console.log('Connecting to database...');
          await connectDB();
          console.log('Database connected successfully');

          // Check if user already exists
          console.log('Checking for existing user with googleId:', account.providerAccountId);
          const existingUser = await User.findOne({ googleId: account.providerAccountId });

          if (!existingUser) {
            // Create new user
            console.log('Creating new user:', user.email);
            await User.create({
              email: user.email,
              name: user.name,
              image: user.image,
              googleId: account.providerAccountId,
            });
            console.log('User created successfully');
          } else {
            console.log('User already exists');
          }

          return true;
        } catch (error) {
          console.error('Error during sign in:', error);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        try {
          await connectDB();
          const dbUser = await User.findOne({ email: session.user.email });
          if (dbUser) {
            session.user.id = dbUser._id.toString();
          }
        } catch (error) {
          console.error('Error fetching user for session:', error);
        }
      }
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
});
