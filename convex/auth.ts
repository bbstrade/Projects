import { convexAuth } from "@convex-dev/auth/server";

import { Password } from "@convex-dev/auth/providers/Password";

import { ResendOTP } from "@convex-dev/auth/providers/ResendOTP";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
    providers: [
        Password({
            verify: ResendOTP,
            profile(params) {
                return {
                    email: params.email as string,
                    name: params.name as string,
                };
            },
        }),
        ResendOTP,
    ],
});
