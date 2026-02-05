"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

interface TaskCommentsProps {
    taskId: Id<"tasks">;
}

export function TaskComments({ taskId }: TaskCommentsProps) {
    const comments = useQuery(api.task_comments.list, { taskId });
    const createComment = useMutation(api.task_comments.create);
    const removeComment = useMutation(api.task_comments.remove);
    const { data: session } = useSession();

    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (comments === undefined) return <div>Зареждане на коментари...</div>;

    const handleSubmit = async () => {
        if (!comment.trim()) return;
        setIsSubmitting(true);
        try {
            await createComment({
                taskId,
                content: comment,
            });
            setComment("");
            toast.success("Коментарът е добавен");
        } catch (error) {
            toast.error("Грешка при добавяне на коментар");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: Id<"taskComments">) => {
        if (confirm("Изтриване на този коментар?")) {
            await removeComment({ id });
            toast.success("Коментарът е изтрит");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" /> Коментари
                </h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {comments.length}
                </span>
            </div>

            <div className="space-y-6">
                {comments.map((c) => (
                    <div key={c._id} className="flex gap-4 group">
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={c.user?.image} />
                            <AvatarFallback>{c.user?.name?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">{c.user?.name || "Неизвестен потребител"}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(c.createdAt, { addSuffix: true })}
                                    </span>
                                </div>
                                {session?.user?.id === c.userId && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDelete(c._id)}
                                    >
                                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-500" />
                                    </Button>
                                )}
                            </div>
                            <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                                {c.content.split(/(@\w+(?:\s\w+)?)/g).map((part, i) =>
                                    part.startsWith('@') ? <span key={i} className="font-medium text-blue-600">{part}</span> : part
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {comments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm italic">
                        Все още няма коментари. Бъдете първият, който ще започне дискусията.
                    </div>
                )}
            </div>

            {/* Comment Input with Mentions */}
            <div className="flex gap-4 mt-6 relative">
                <Avatar className="w-8 h-8">
                    <AvatarFallback>ME</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2 relative">
                    <MentionInput
                        value={comment}
                        onChange={setComment}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                    />
                </div>
            </div>
        </div>
    );
}

// Sub-component to handle Mention Logic to keep main component clean
function MentionInput({ value, onChange, onSubmit, isSubmitting }: any) {
    const [mentionQuery, setMentionQuery] = useState("");
    const [showMentions, setShowMentions] = useState(false);

    // Fetch users for mention
    const users = useQuery(api.users.search, { query: mentionQuery });

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        onChange(newValue);

        // Simple detection: ends with @ or @something
        const lastWord = newValue.split(/\s/).pop();
        if (lastWord?.startsWith("@")) {
            setMentionQuery(lastWord.substring(1));
            setShowMentions(true);
        } else {
            setShowMentions(false);
        }
    };

    const handleSelectUser = (userName: string) => {
        const words = value.split(/\s/);
        words.pop(); // Remove the partial mention
        const newValue = [...words, `@${userName} `].join(" ");
        onChange(newValue);
        setShowMentions(false);
    };

    return (
        <div className="relative">
            {showMentions && users && users.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-popover border rounded-md shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-1">
                        <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">Предложени потребители</div>
                        {users.map((user) => (
                            <button
                                key={user._id}
                                className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm flex items-center gap-2"
                                onClick={() => handleSelectUser(user.name || "User")}
                            >
                                <Avatar className="w-5 h-5">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback className="text-[10px]">{user.name?.[0]}</AvatarFallback>
                                </Avatar>
                                <span>{user.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            <Textarea
                placeholder="Напишете коментар... (Използвайте @ за споменаване)"
                value={value}
                onChange={handleChange}
                className="min-h-[80px]"
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (!showMentions) onSubmit();
                    }
                }}
            />
            <div className="flex justify-end mt-2">
                <Button size="sm" onClick={onSubmit} disabled={isSubmitting || !value.trim()}>
                    <Send className="w-4 h-4 mr-2" /> Коментар
                </Button>
            </div>
        </div>
    );
}
