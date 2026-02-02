"use client";

import { ReactNode, Suspense } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { Loading } from "./loading";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function ConvexClientProvider({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <Suspense fallback={<Loading />}>
            <ConvexAuthNextjsProvider client={convex}>
                {children}
            </ConvexAuthNextjsProvider>
        </Suspense>
    );
}
