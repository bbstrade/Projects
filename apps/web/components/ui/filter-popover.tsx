"use client";

import React from "react";
import { Check, ChevronsUpDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface FilterOption {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
}

interface FilterPopoverProps {
    title: string;
    options: FilterOption[];
    value?: string | string[]; // Can be single or multi
    onChange: (value: string) => void;
    multiSelect?: boolean;
    icon?: React.ComponentType<{ className?: string }>;
}

export function FilterPopover({
    title,
    options,
    value,
    onChange,
    multiSelect = false,
    icon: Icon = Filter,
}: FilterPopoverProps) {
    const [open, setOpen] = React.useState(false);

    // Helper to get labels for selected values
    const selectedValues = Array.isArray(value) ? value : [value];
    const selectedOptions = options.filter((opt) => selectedValues.includes(opt.value));
    const hasSelection = selectedValues.length > 0 && !selectedValues.includes("all");

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "h-9 border-dashed rounded-lg px-3 text-xs font-bold shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-900/20",
                        hasSelection ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300" : "text-muted-foreground"
                    )}
                >
                    <Icon className="mr-2 h-3.5 w-3.5 opacity-70" />
                    {title}
                    {hasSelection && (
                        <>
                            <div className="mx-2 h-4 w-[1px] bg-border/50" />
                            <div className="hidden lg:flex gap-1">
                                {selectedValues.length > 2 ? (
                                    <Badge variant="secondary" className="rounded-sm px-1 font-normal h-5 text-[10px]">
                                        {selectedValues.length} selected
                                    </Badge>
                                ) : (
                                    selectedOptions.map((opt) => (
                                        <Badge
                                            key={opt.value}
                                            variant="secondary"
                                            className="rounded-sm px-1 font-normal h-5 text-[10px] bg-white dark:bg-slate-950"
                                        >
                                            {opt.label}
                                        </Badge>
                                    ))
                                )}
                            </div>
                            <div className="lg:hidden flex ml-1">
                                <Badge variant="secondary" className="rounded-sm px-1 font-normal h-5 text-[10px]">
                                    {selectedValues.length}
                                </Badge>
                            </div>
                        </>
                    )}
                    <ChevronsUpDown className="ml-auto h-3 w-3 shrink-0 opacity-50 ml-2" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={`Search ${title.toLowerCase()}...`} />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => {
                                const isSelected = selectedValues.includes(option.value);
                                return (
                                    <CommandItem
                                        key={option.value}
                                        value={option.label} // Use label for efficient UI searching by default
                                        onSelect={() => {
                                            onChange(option.value);
                                            // Close if single select and choosing a new value
                                            if (!multiSelect) setOpen(false);
                                        }}
                                        className="text-xs"
                                    >
                                        <div
                                            className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "opacity-50 [&_svg]:invisible"
                                            )}
                                        >
                                            <Check className={cn("h-3 w-3")} />
                                        </div>
                                        {option.icon && (
                                            <option.icon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                        )}
                                        <span>{option.label}</span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                        {hasSelection && (
                            <>
                                <CommandSeparator />
                                <CommandGroup>
                                    <CommandItem
                                        onSelect={() => onChange("all")}
                                        className="justify-center text-center text-xs font-bold"
                                    >
                                        Clear filters
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
