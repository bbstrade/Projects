"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileJson } from "lucide-react";

export default function DataExportTab() {
    // We can't use useQuery for on-click download easily if the dataset is huge, 
    // but for this task we are fetching everything via a query that returns JSON.
    // To trigger it on button click, we might need a "lazy" query or just use useQuery and enable it only when clicked?
    // Or better: Use `fetch` to an action? 
    // The instructions say "Workflow: 1. Click ... 2. Fetch ...".
    // Using `conves.query` directly from the client sdk `convex.query(api.settings.exportUserData)` is possible if we have the `convex` object.
    // In React, we can use `useConvex()` hook.

    const { useConvex } = require("convex/react"); // Require to avoid import issues if not top level standard
    const convex = useConvex();
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const data = await convex.query(api.settings.exportUserData);

            const exportData = {
                exported_at: new Date().toISOString(),
                ...data
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `data_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Export failed:", error);
            // Optionally show toast error
        } finally {
            setDownloading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Експорт на данни</CardTitle>
                <CardDescription>Изтеглете копие на вашите данни от системата</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="rounded-lg border p-6 flex flex-col items-center text-center space-y-4 bg-muted/20">
                    <div className="p-4 bg-primary/10 rounded-full text-primary">
                        <FileJson className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-semibold">JSON Експорт</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            Вашите проекти, задачи, коментари и настройки ще бъдат експортирани в структуриран JSON формат.
                        </p>
                    </div>
                    <Button onClick={handleDownload} disabled={downloading}>
                        <Download className="mr-2 h-4 w-4" />
                        {downloading ? "Генериране..." : "Изтегли данни"}
                    </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                    <p>Забележка: Експортът съдържа само данни, до които имате достъп. Лични съобщения и данни на други потребители не са включени, освен ако не са част от споделени ресурси.</p>
                </div>
            </CardContent>
        </Card>
    );
}
