"use client";

import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";

interface ChartWidgetProps {
    type: "bar" | "line" | "area" | "pie";
    data: any[];
    config: {
        xKey: string;
        yKeys: string[]; // Support multiple series
        colors: string[];
    };
}

const COLORS = [
    "#3b82f6", // blue
    "#22c55e", // green
    "#eab308", // yellow
    "#ef4444", // red
    "#a855f7", // purple
    "#f97316", // orange
    "#06b6d4", // cyan
    "#ec4899", // pink
];

export function ChartWidget({ type, data, config }: ChartWidgetProps) {
    // Ensure colors exist
    const colors = config.colors && config.colors.length > 0 ? config.colors : COLORS;

    if (!data || data.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                No data available
            </div>
        );
    }

    if (type === "pie") {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey={config.yKeys[0]} // Usually 'value' for pie charts
                        nameKey={config.xKey}     // Usually 'name' for pie charts
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any, name: any) => [value, name]}
                    />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        );
    }

    const renderChart = () => {
        const commonProps = {
            data: data,
            margin: { top: 10, right: 30, left: 0, bottom: 0 }
        };

        const renderAxes = () => (
            <>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                    dataKey={config.xKey}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ fill: 'transparent' }}
                />
                <Legend />
            </>
        );

        switch (type) {
            case "area":
                return (
                    <AreaChart {...commonProps}>
                        {renderAxes()}
                        {config.yKeys.map((key, index) => (
                            <Area
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stackId="1" // Stack by default for area? Maybe make configurable
                                stroke={colors[index % colors.length]}
                                fill={colors[index % colors.length]}
                                fillOpacity={0.6}
                            />
                        ))}
                    </AreaChart>
                );
            case "line":
                return (
                    <LineChart {...commonProps}>
                        {renderAxes()}
                        {config.yKeys.map((key, index) => (
                            <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={colors[index % colors.length]}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6 }}
                            />
                        ))}
                    </LineChart>
                );
            case "bar":
            default:
                return (
                    <BarChart {...commonProps}>
                        {renderAxes()}
                        {config.yKeys.map((key, index) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                fill={colors[index % colors.length]}
                                radius={[4, 4, 0, 0]}
                            />
                        ))}
                    </BarChart>
                );
        }
    };

    return (
        <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
        </ResponsiveContainer>
    );
}
