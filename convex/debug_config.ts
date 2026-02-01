
import { query } from "./_generated/server";

export const getEnv = query({
    args: {},
    handler: async (ctx) => {
        return {
            SITE_URL: process.env.SITE_URL,
            CONVEX_SITE_URL: process.env.CONVEX_SITE_URL,
            NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
            IN_ANALYSIS: "Checking why token issuer might fail"
        };
    },
});
