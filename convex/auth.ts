import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";

import Resend from "@auth/core/providers/resend";

/**
 * Convex Auth configuration
 * Supports:
 * - Password authentication (email/password)
 * - Google OAuth (requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)
 * - Resend (Magic Links) for password recovery and passwordless login (requires AUTH_RESEND_KEY)
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
    providers: [
        Password,
        Google,
        Resend,
    ],
});
