import {
    convexAuthNextjsMiddleware,
    createRouteMatcher,
    nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

// Public pages that don't require authentication
const isPublicPage = createRouteMatcher(["/", "/login", "/register", "/auth/*"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
    try {
        console.log("Middleware running for:", request.nextUrl.pathname);
        console.log("Convex URL Configured:", !!process.env.NEXT_PUBLIC_CONVEX_URL);

        // Redirect unauthenticated users to login
        if (!isPublicPage(request) && !(await convexAuth.isAuthenticated())) {
            console.log("Redirecting to login");
            return nextjsMiddlewareRedirect(request, "/login");
        }

        // Redirect authenticated users away from login/register
        if (
            (request.nextUrl.pathname === "/login" ||
                request.nextUrl.pathname === "/register") &&
            (await convexAuth.isAuthenticated())
        ) {
            console.log("Redirecting to dashboard");
            return nextjsMiddlewareRedirect(request, "/dashboard");
        }
    } catch (error) {
        console.error("Middleware CRITICAL ERROR:", error);
        // Fallback: allow request to proceed if middleware fails, to avoid 500
        // (Note: This is just for debugging to see the error)
        // return NextResponse.next();
        throw error; // Re-throw to see stack trace in logs if possible, or comment this out to suppress
    }
});

export const config = {
    matcher: ["/((?!.*\\..*|_next).*)!", "/", "/(api|trpc)(.*)"],
};
