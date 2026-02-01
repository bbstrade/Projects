import {
    convexAuthNextjsMiddleware,
    createRouteMatcher,
    nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

// Public pages that don't require authentication
const isPublicPage = createRouteMatcher(["/login", "/register", "/auth/(.*)"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
    // Redirect unauthenticated users to login
    // BUT allow requests with "code" (OAuth callback) to pass through so the client can handle the exchange
    const hasCode = request.nextUrl.searchParams.has("code");
    if (!isPublicPage(request) && !(await convexAuth.isAuthenticated()) && !hasCode) {
        return nextjsMiddlewareRedirect(request, "/login");
    }

    // Redirect authenticated users away from login/register
    if (
        (request.nextUrl.pathname === "/login" ||
            request.nextUrl.pathname === "/register") &&
        (await convexAuth.isAuthenticated())
    ) {
        return nextjsMiddlewareRedirect(request, "/dashboard");
    }
}, { verbose: true });

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)!", "/", "/(api|trpc)(.*)"],
};
