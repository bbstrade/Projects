"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WidgetWrapper } from "./widget-wrapper";
import { MetricWidget } from "./metric-widget";
import { ChartWidget } from "./chart-widget";
import { Loader2 } from "lucide-react";

interface SmartWidgetProps {
    type: string;
    config: {
        title: string;
        dataSource: string;
        metric: string;
        metricField?: string;
        groupBy?: string;
        filters?: any;
        dateRange?: string;
        colors?: string[];
    };
    isEditing?: boolean;
    onDelete?: () => void;
    onEdit?: () => void;
    dragHandleProps?: any;
}

export function SmartWidget({ type, config, isEditing, onDelete, onEdit, dragHandleProps }: SmartWidgetProps) {
    const data = useQuery(api.customReports.getWidgetData, {
        dataSource: config.dataSource,
        metric: config.metric,
        metricField: config.metricField,
        groupBy: config.groupBy,
        filters: config.filters,
        dateRange: config.dateRange,
    });

    const isLoading = data === undefined;

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            );
        }

        if (type === "metric") {
            return (
                <MetricWidget
                    value={data.value || 0}
                    label="Общо"
                    color={config.colors?.[0]}
                />
            );
        }

        if (["bar", "line", "area", "pie"].includes(type)) {
            // Transform data for charts
            // Backend returns { type: "grouped", data: [...] } or { type: "metric", value, total }

            if (data.type === "metric") {
                // If we tried to chart a single metric, maybe show it as a single bar or warn?
                // For now, let's just show it as a metric widget fallback
                return (
                    <MetricWidget
                        value={data.value || 0}
                        label="Общо"
                    />
                );
            }

            return (
                <ChartWidget
                    type={type as any}
                    data={data.data || []}
                    config={{
                        xKey: "name",
                        yKeys: ["value"],
                        colors: config.colors || [],
                    }}
                />
            );
        }

        return <div>Unknown widget type: {type}</div>;
    };

    return (
        <WidgetWrapper
            title={config.title}
            isEditing={isEditing}
            onDelete={onDelete}
            onEdit={onEdit}
            dragHandleProps={dragHandleProps}
            className="bg-card"
        >
            {renderContent()}
        </WidgetWrapper>
    );
}
