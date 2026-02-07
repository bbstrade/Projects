"use client";

import { useLanguage } from "@/components/language-provider";
import { TemplateManager } from "@/components/templates/template-manager";

export default function TemplatesPage() {
    const { t } = useLanguage();

    return (
        <div className="container max-w-7xl py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">{t("templates")}</h1>
                <p className="text-muted-foreground">{t("templatesSubtitle")}</p>
            </div>
            <div className="h-full">
                <TemplateManager />
            </div>
        </div>
    );
}
