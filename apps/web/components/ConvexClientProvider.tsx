"use client";

import { ReactNode, Suspense } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { authClient } from "@/lib/auth-client";
import { Loading } from "./loading";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function ConvexClientProvider({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <Suspense fallback={<Loading />}>
            <ConvexBetterAuthProvider client={convex} authClient={authClient}>
                {children}
            </ConvexBetterAuthProvider>
        </Suspense>
    );
}
