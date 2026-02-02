import { convexAuth } from "@convex-dev/auth/server";

import { Password } from "@convex-dev/auth/providers/Password";

import { Resend } from "resend";
import { Email } from "@convex-dev/auth/providers/Email";
import { alphabet, generateRandomString } from "oslo/crypto/random"; // Verify if oslo is available? No.

// custom implementation
export const ResendOTP = Email({
    id: "resend-otp",
    apiKey: process.env.AUTH_RESEND_KEY,
    maxAge: 60 * 15, // 15 minutes
    async generateVerificationToken() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },
    async sendVerificationRequest({ identifier: email, provider, token }) {
        const resend = new Resend(provider.apiKey);
        const { error } = await resend.emails.send({
            from: "My App <onboarding@resend.dev>",
            to: email,
            subject: `Sign in verification code`,
            html: `<p>Your verification code is: <strong>${token}</strong></p>`,
        });

        if (error) {
            throw new Error("Could not send email: " + error.message);
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
