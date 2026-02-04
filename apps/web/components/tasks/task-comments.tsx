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

    if (comments === undefined) return <div>Loading comments...</div>;

    const handleSubmit = async () => {
        if (!comment.trim()) return;
        setIsSubmitting(true);
        try {
            await createComment({
                taskId,
                content: comment,
            });
            setComment("");
            toast.success("Comment added");
        } catch (error) {
            toast.error("Failed to add comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: Id<"taskComments">) => {
        if (confirm("Delete this comment?")) {
            await removeComment({ id });
            toast.success("Comment deleted");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" /> Comments
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
                                    <span className="font-semibold text-sm">{c.user?.name || "Unknown User"}</span>
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
                                {c.content}
                            </div>
                        </div>
                    </div>
                ))}

                {comments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm italic">
                        No comments yet. Be the first to start the discussion.
                    </div>
                )}
            </div>

            <div className="flex gap-4 mt-6">
                <Avatar className="w-8 h-8">
                    <AvatarFallback>ME</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                    <Textarea
                        placeholder="Write a comment..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="min-h-[80px]"
                    />
                    <div className="flex justify-end">
                        <Button size="sm" onClick={handleSubmit} disabled={isSubmitting || !comment.trim()}>
                            <Send className="w-4 h-4 mr-2" /> Comment
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
