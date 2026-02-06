"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SmartWidget } from "./widgets/smart-widget";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CustomReportViewProps {
    reportId: Id<"customReports">;
}

export function CustomReportView({ reportId }: CustomReportViewProps) {
    const report = useQuery(api.customReports.get, { id: reportId });

    if (report === undefined) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (report === null) {
        return (
            <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                Отчетът не е намерен. Може да е бил изтрит.
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex flex-col">
                <h2 className="text-2xl font-bold tracking-tight">{report.name}</h2>
                {report.description && (
                    <p className="text-muted-foreground">{report.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>Автор: {report.userName}</span>
                    <span>•</span>
                    <span>Обновено: {new Date(report.updatedAt).toLocaleDateString()}</span>
                </div>
            </div>

            {report.layout.length === 0 ? (
                <Card className="border-dashed bg-muted/30">
                    <CardContent className="h-[300px] flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                        <p className="mb-2">Този отчет е празен</p>
                        <p className="text-sm">Редактирайте отчета, за да добавите графики и метрики</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[300px]">
                    {report.layout.map((item) => {
                        // Calculate span based on width (1-4)
                        let colSpan = "col-span-1";
                        if (item.position.w === 4) colSpan = "col-span-1 md:col-span-2 lg:col-span-4";
                        else if (item.position.w === 3) colSpan = "col-span-1 md:col-span-2 lg:col-span-3";
                        else if (item.position.w === 2) colSpan = "col-span-1 md:col-span-2";

                        return (
                            <div key={item.id} className={`${colSpan} h-full min-h-[300px]`}>
                                <SmartWidget
                                    type={item.type}
                                    config={item.config}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
