import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnLogin = nextUrl.pathname.startsWith('/login');
            const isOnApi = nextUrl.pathname.startsWith('/api');

            if (isOnApi) return true;
            if (isOnLogin) {
                if (isLoggedIn) return Response.redirect(new URL('/campaigns', nextUrl));
                return true;
            }
            if (!isLoggedIn) return false;
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.brokerId = (user as any).brokerId;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id as string;
                (session.user as any).role = token.role as string;
                (session.user as any).brokerId = token.brokerId as string;
            }
            return session;
        },
    },
    providers: [],
};
