import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const get = query({
    args: {},
    handler: async (ctx) => {
        console.log("DEBUG ENV:", {
            SITE_URL: process.env.SITE_URL,
            CONVEX_SITE_URL: process.env.CONVEX_SITE_URL,
            NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
        });
        return await getAuthUserId(ctx);
    },
});
