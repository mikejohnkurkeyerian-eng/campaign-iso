// Middleware for auth protection
// Uncomment the below to enable auth on all routes:
// export { auth as middleware } from "@/lib/auth";

// For now, run without auth protection for easier development
export default function middleware() { }

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
