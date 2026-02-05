"use client";

import { ReactNode, Suspense } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/better-auth/react";
import { Loading } from "./loading";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function ConvexClientProvider({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <Suspense fallback={<Loading />}>
            <ConvexAuthProvider client={convex}>
                {children}
            </ConvexAuthProvider>
        </Suspense>
    );
}
