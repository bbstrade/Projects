import { mutation } from "./_generated/server";

export const deleteOrphanedAccounts = mutation({
    handler: async (ctx) => {
        const accounts = await ctx.db.query("authAccounts").collect();
        let deletedCount = 0;

        for (const account of accounts) {
            const user = await ctx.db.get(account.userId);
            if (user === null) {
                await ctx.db.delete(account._id);
                deletedCount++;
            }
        }

        return `Deleted ${deletedCount} orphaned authAccounts.`;
    },
});
