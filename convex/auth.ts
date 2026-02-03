import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";

console.log("Resend API Key present:", !!process.env.AUTH_RESEND_KEY);

export const ResendOTP = Email({
    apiKey: process.env.AUTH_RESEND_KEY,
    maxAge: 60 * 15, // 15 minutes
    async generateVerificationToken() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },
    async sendVerificationRequest({ identifier: email, provider, token }) {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.AUTH_RESEND_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "Project Manager <onboarding@resend.dev>",
                to: [email],
                subject: `Sign in verification code`,
                html: `<p>Your verification code is: <strong>${token}</strong></p>`,
            }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Could not send email: ${text}`);
        }
    },
});

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
