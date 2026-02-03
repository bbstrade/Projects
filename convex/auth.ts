import { betterAuth } from "better-auth";
import { convexAuth } from "@convex-dev/better-auth";
import { Password } from "@convex-dev/better-auth";

export const auth = betterAuth({
    database: convexAuth({
        // We will need to define schema or rely on component
    }),
    emailAndPassword: {
        enabled: true
    }
});
