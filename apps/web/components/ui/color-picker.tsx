"use client";

import * as React from "react";
import { Check, Paintbrush } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PRESET_COLORS = [
    "#ef4444", // Red
    "#f97316", // Orange
    "#f59e0b", // Amber
    "#eab308", // Yellow
    "#84cc16", // Lime
    "#22c55e", // Green
    "#10b981", // Emerald
    "#14b8a6", // Teal
    "#06b6d4", // Cyan
    "#0ea5e9", // Sky
    "#3b82f6", // Blue
    "#6366f1", // Indigo
    "#8b5cf6", // Violet
    "#a855f7", // Purple
    "#d946ef", // Fuchsia
    "#ec4899", // Pink
    "#f43f5e", // Rose
    "#64748b", // Slate
];

interface ColorPickerProps {
    value?: string;
    onChange: (value: string) => void;
    className?: string;
}

export function ColorPicker({ value = "#3b82f6", onChange, className }: ColorPickerProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal px-2.5",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <div className="w-5 h-5 rounded-full mr-2 border border-border" style={{ backgroundColor: value }} />
                    <span className="flex-1 truncate">{value}</span>
                    <Paintbrush className="w-4 h-4 opacity-50 ml-2" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Preset Colors</Label>
                        <div className="grid grid-cols-6 gap-1.5">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={cn(
                                        "w-full aspect-square rounded-md border border-transparent hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                        value === color && "ring-2 ring-ring ring-offset-2 border-background"
                                    )}
                                    style={{ backgroundColor: color }}
                                    onClick={() => {
                                        onChange(color);
                                        setOpen(false);
                                    }}
                                >
                                    {value === color && (
                                        <Check className="w-3 h-3 text-white mx-auto drop-shadow-md" />
                                    )}
                                    <span className="sr-only">{color}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Custom Hex</Label>
                        <div className="flex gap-2">
                            <Input
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                className="h-8"
                                placeholder="#000000"
                            />
                            <Input
                                type="color"
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                className="h-8 w-12 p-1 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
