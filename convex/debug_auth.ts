import { query } from "./_generated/server";

export const session = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        return {
            identity,
            now: Date.now(),
            env: process.env.CONVEX_ENV,
        };
    },
});
