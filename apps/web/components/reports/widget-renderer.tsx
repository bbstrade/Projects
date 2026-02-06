"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    LineChart,
    Line,
    Legend,
} from "recharts";
import { Hash, TrendingUp, TrendingDown } from "lucide-react";

interface WidgetConfig {
    title: string;
    dataSource: string;
    metric: string;
    metricField?: string;
    groupBy?: string;
    filters?: Record<string, unknown>;
    dateRange?: string;
    colors?: string[];
}

interface WidgetRendererProps {
    type: string;
    config: WidgetConfig;
    className?: string;
}

const DEFAULT_COLORS = [
    "#3b82f6", "#22c55e", "#f59e0b", "#ef4444",
    "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"
];

export function WidgetRenderer({ type, config, className }: WidgetRendererProps) {
    const data = useQuery(api.customReports.getWidgetData, {
        dataSource: config.dataSource,
        metric: config.metric,
        metricField: config.metricField,
        groupBy: config.groupBy,
        dateRange: config.dateRange === "all" ? undefined : config.dateRange,
    });

    if (data === undefined) {
        return (
            <Card className={className}>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm">{config.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[200px]">
                    <div className="animate-pulse text-muted-foreground">Зареждане...</div>
                </CardContent>
            </Card>
        );
    }

    // Render based on widget type
    switch (type) {
        case "metric":
            return <MetricWidget config={config} data={data} className={className} />;
        case "pie":
            return <PieWidget config={config} data={data} className={className} />;
        case "bar":
            return <BarWidget config={config} data={data} className={className} />;
        case "line":
            return <LineWidget config={config} data={data} className={className} />;
        default:
            return (
                <Card className={className}>
                    <CardContent className="p-4 text-muted-foreground">
                        Неподдържан тип: {type}
                    </CardContent>
                </Card>
            );
    }
}

interface WidgetProps {
    config: WidgetConfig;
    data: { type: string; value?: number; data?: Array<{ name: string; value: number; fill?: string }>; total: number };
    className?: string;
}

function MetricWidget({ config, data, className }: WidgetProps) {
    const value = data.value ?? data.total;
    const previousValue = Math.round(value * 0.9); // Mock previous value for demo
    const change = value - previousValue;
    const changePercent = previousValue > 0 ? Math.round((change / previousValue) * 100) : 0;
    const isPositive = change >= 0;

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{value.toLocaleString()}</span>
                    <div className={`flex items-center text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
                        {isPositive ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                            <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {isPositive ? "+" : ""}{changePercent}%
                    </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    от {config.dataSource === "tasks" ? "задачи" :
                        config.dataSource === "projects" ? "проекти" :
                            config.dataSource === "approvals" ? "одобрения" : "файлове"}
                </p>
            </CardContent>
        </Card>
    );
}

function PieWidget({ config, data, className }: WidgetProps) {
    const chartData = data.data || [];

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, percent }) =>
                                    `${name} ${(percent * 100).toFixed(0)}%`
                                }
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.fill || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Няма данни
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function BarWidget({ config, data, className }: WidgetProps) {
    const chartData = data.data || [];

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ left: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.fill || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Няма данни
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function LineWidget({ config, data, className }: WidgetProps) {
    const chartData = data.data || [];

    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
            </CardHeader>
            <CardContent className="h-[250px]">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ fill: "#3b82f6" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        Няма данни
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
