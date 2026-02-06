import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

interface MetricWidgetProps {
    value: number | string;
    label?: string;
    trend?: {
        value: number;
        label: string;
        direction: "up" | "down" | "neutral";
    };
    icon?: React.ReactNode;
    color?: string;
}

export function MetricWidget({ value, label, trend, icon, color = "text-primary" }: MetricWidgetProps) {
    return (
        <div className="flex flex-col h-full justify-between">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-2xl font-bold">{value}</div>
                    {label && <p className="text-xs text-muted-foreground mt-1">{label}</p>}
                </div>
                {icon && <div className={`${color} p-2 bg-muted/50 rounded-full`}>{icon}</div>}
            </div>

            {trend && (
                <div className="flex items-center gap-2 mt-4 text-xs">
                    {trend.direction === "up" ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : trend.direction === "down" ? (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                    ) : (
                        <Minus className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={
                        trend.direction === "up" ? "text-green-600 font-medium" :
                            trend.direction === "down" ? "text-red-600 font-medium" :
                                "text-muted-foreground"
                    }>
                        {trend.value}%
                    </span>
                    <span className="text-muted-foreground">{trend.label}</span>
                </div>
            )}
        </div>
    );
}
