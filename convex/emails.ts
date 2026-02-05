import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { Resend } from "resend";

export const sendEmail = internalAction({
    args: {
        to: v.union(v.string(), v.array(v.string())),
        subject: v.string(),
        html: v.string(),
        text: v.optional(v.string()), // Fallback text
    },
    handler: async (ctx, args) => {
        const resendApiKey = process.env.RESEND_API_KEY;

        if (!resendApiKey) {
            console.warn("RESEND_API_KEY is not set. Skipping email sending.");
            return { success: false, error: "Configuration Error" };
        }

        const resend = new Resend(resendApiKey);

        try {
            const { data, error } = await resend.emails.send({
                from: "Municipal Bank <onboarding@resend.dev>", // Default generic sender for dev
                to: args.to,
                subject: args.subject,
                html: args.html,
                text: args.text,
            });

            if (error) {
                console.error("Resend error:", error);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (err: any) {
            console.error("Email sending failed:", err);
            return { success: false, error: err.message };
        }
    },
});
