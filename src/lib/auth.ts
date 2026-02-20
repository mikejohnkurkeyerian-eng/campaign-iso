import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from '@/lib/db';
import { authConfig } from "./auth.config"

async function getUser(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    secret: process.env.AUTH_SECRET || 'campaign-iso-dev-secret',
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({
                        email: z.string().email(),
                        password: z.string().min(6),
                    })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;
                    const user = await getUser(email.toLowerCase());
                    if (!user) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password || '');
                    if (!passwordsMatch) return null;

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        brokerId: user.brokerId
                    } as any;
                }
                return null;
            },
        }),
    ],
});
