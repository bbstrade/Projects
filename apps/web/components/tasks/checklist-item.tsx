"use client";

import { useState, useEffect } from "react";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

import { useLanguage } from "@/components/language-provider";

interface ChecklistItemProps {
    item: { id: string; text: string; completed: boolean };
    subtaskId: Id<"subtasks">;
    onUpdate: (itemId: string, newText: string) => void;
    onToggle: (itemId: string) => void;
    onRemove: (itemId: string) => void;
}

export function ChecklistItem({ item, subtaskId, onUpdate, onToggle, onRemove }: ChecklistItemProps) {
    const { t } = useLanguage();
    const [text, setText] = useState(item.text);

    useEffect(() => {
        setText(item.text);
    }, [item.text]);

    const handleBlur = () => {
        if (text !== item.text) {
            onUpdate(item.id, text);
        }
    };

    return (
        <div className="flex items-center gap-2 group/item">
            <Checkbox
                checked={item.completed}
                onCheckedChange={() => onToggle(item.id)}
            />
            <Input
                value={text}
                placeholder={t("descriptionPlaceholder") || "Описание..."}
                onChange={(e) => setText(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handleBlur();
                    }
                }}
                className={cn(
                    "h-7 text-sm flex-1 bg-transparent border-none shadow-none focus-visible:ring-0",
                    item.completed && "line-through text-muted-foreground"
                )}
            />
            <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 opacity-0 group-hover/item:opacity-100 text-destructive hover:text-destructive"
                onClick={() => onRemove(item.id)}
            >
                <X className="h-3 w-3" />
            </Button>
        </div>
    );
}
