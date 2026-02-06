"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MentionInputProps {
    value: string;
    onChange: (value: string, mentions: Id<"users">[]) => void;
    placeholder?: string;
    className?: string;
    teamId?: string;
    disabled?: boolean;
}

interface MentionUser {
    _id: Id<"users">;
    name: string;
    avatar?: string;
}

export function MentionInput({
    value,
    onChange,
    placeholder,
    className,
    teamId,
    disabled,
}: MentionInputProps) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [cursorPosition, setCursorPosition] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentions, setMentions] = useState<Id<"users">[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Search for users when typing @ (empty string shows all team members)
    const searchResults = useQuery(
        api.comments.searchUsersForMention,
        showSuggestions ? { query: searchQuery, teamId } : "skip"
    );

    const users = (searchResults || []) as MentionUser[];
    const isLoadingUsers = searchResults === undefined && showSuggestions;

    // Detect @ and show suggestions
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const position = e.target.selectionStart || 0;
        setCursorPosition(position);

        // Find if we're typing after @
        const textBeforeCursor = newValue.slice(0, position);
        const atIndex = textBeforeCursor.lastIndexOf("@");

        if (atIndex !== -1) {
            const textAfterAt = textBeforeCursor.slice(atIndex + 1);
            // Check if there's no space after @
            if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
                setSearchQuery(textAfterAt);
                setShowSuggestions(true);
                setSelectedIndex(0);
            } else {
                setShowSuggestions(false);
            }
        } else {
            setShowSuggestions(false);
        }

        onChange(newValue, mentions);
    };

    // Handle keyboard navigation in suggestions
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || users.length === 0) return;

        switch (e.key) {
            case "ArrowDown":
                e.preventDefault();
                setSelectedIndex((prev) =>
                    prev < users.length - 1 ? prev + 1 : prev
                );
                break;
            case "ArrowUp":
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
                break;
            case "Enter":
            case "Tab":
                if (showSuggestions && users[selectedIndex]) {
                    e.preventDefault();
                    insertMention(users[selectedIndex]);
                }
                break;
            case "Escape":
                setShowSuggestions(false);
                break;
        }
    };

    // Insert mention into text
    const insertMention = useCallback((user: MentionUser) => {
        const textBeforeCursor = value.slice(0, cursorPosition);
        const atIndex = textBeforeCursor.lastIndexOf("@");
        const textAfterCursor = value.slice(cursorPosition);

        // Format: @[Name](userId) for rich text parsing
        const mentionText = `@${user.name} `;
        const newValue =
            textBeforeCursor.slice(0, atIndex) +
            mentionText +
            textAfterCursor;

        const newMentions = [...mentions, user._id];
        setMentions(newMentions);
        onChange(newValue, newMentions);
        setShowSuggestions(false);

        // Focus back on textarea
        setTimeout(() => {
            textareaRef.current?.focus();
            const newPosition = atIndex + mentionText.length;
            textareaRef.current?.setSelectionRange(newPosition, newPosition);
        }, 0);
    }, [value, cursorPosition, mentions, onChange]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(e.target as Node) &&
                !textareaRef.current?.contains(e.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative">
            <Textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={cn("min-h-[100px]", className)}
                disabled={disabled}
            />

            {/* Suggestions dropdown */}
            {showSuggestions && (
                <div
                    ref={suggestionsRef}
                    className="absolute bottom-full left-0 mb-1 w-64 max-h-48 overflow-y-auto bg-white rounded-lg shadow-lg border z-50"
                >
                    <div className="p-1">
                        {isLoadingUsers ? (
                            <div className="flex items-center justify-center py-4 text-slate-400">
                                <span className="text-sm">Зареждане...</span>
                            </div>
                        ) : users.length > 0 ? (
                            users.map((user, index) => (
                                <button
                                    key={user._id}
                                    type="button"
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors",
                                        index === selectedIndex
                                            ? "bg-blue-50 text-blue-700"
                                            : "hover:bg-slate-50"
                                    )}
                                    onClick={() => insertMention(user)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback className="text-xs bg-slate-200">
                                            {user.name?.charAt(0) || "?"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate">{user.name}</span>
                                </button>
                            ))
                        ) : (
                            <div className="flex items-center justify-center py-4 text-slate-400">
                                <span className="text-sm">Няма намерени потребители</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Hint text */}
            <p className="text-[10px] text-slate-400 mt-1">
                Напишете @ за да споменете колега
            </p>
        </div>
    );
}
