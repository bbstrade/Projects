import { createAuthClient } from "better-auth/react";
import { convexAuthClient } from "@convex-dev/better-auth/client";

export const authClient = createAuthClient({
    plugins: [convexAuthClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
