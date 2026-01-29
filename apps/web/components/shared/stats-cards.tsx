"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatItem {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color?: string;
}

interface StatsCardsProps {
    stats: StatItem[];
}

export function StatsCards({ stats }: StatsCardsProps) {
    return (
        <div className={cn(
            "grid gap-4 md:grid-cols-2",
            stats.length <= 4 ? "lg:grid-cols-4" : "lg:grid-cols-5"
        )}>
            {stats.map((stat, index) => (
                <Card key={index} className="overflow-hidden border-none shadow-md bg-white dark:bg-slate-950 transition-all hover:shadow-lg">
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-center gap-3 md:gap-4 min-w-0">
                            <div className={cn(
                                "p-2 md:p-3 rounded-xl transition-colors shrink-0",
                                stat.color || "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                            )}>
                                <stat.icon className="h-5 w-5 md:h-6 md:h-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs md:text-sm font-medium text-muted-foreground truncate" title={stat.label}>
                                    {stat.label}
                                </p>
                                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5 md:mt-1 truncate">
                                    {stat.value}
                                </h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
