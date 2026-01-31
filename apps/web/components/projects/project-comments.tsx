"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Trash2, Send, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProjectCommentsProps {
    projectId: Id<"projects">;
}

export function ProjectComments({ projectId }: ProjectCommentsProps) {
    const comments = useQuery(api.project_comments.list, { projectId });
    const createComment = useMutation(api.project_comments.create);
    const deleteComment = useMutation(api.project_comments.deleteComment);
    const currentUser = useQuery(api.users.me);

    const [newComment, setNewComment] = useState("");

    const handleSubmit = async () => {
        if (!newComment.trim()) return;

        try {
            await createComment({
                projectId,
                content: newComment,
            });
            setNewComment("");
            toast.success("Comment added");
        } catch (error) {
            toast.error("Failed to add comment");
        }
    };

    const handleDelete = async (id: Id<"projectComments">) => {
        if (confirm("Delete this comment?")) {
            await deleteComment({ id });
            toast.success("Comment deleted");
        }
    };

    if (comments === undefined) return <div>Loading comments...</div>;

    return (
        <div className="flex flex-col h-[600px] border rounded-lg bg-white dark:bg-slate-950 overflow-hidden">
            <div className="p-4 border-b bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="font-semibold">Discussion</h3>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                    {comments.length === 0 && (
                        <p className="text-center text-muted-foreground py-10">No comments yet. Start the discussion!</p>
                    )}
                    {comments.map((comment) => (
                        <div key={comment._id} className="flex gap-4 group">
                            <Avatar className="w-8 h-8 mt-1">
                                <AvatarImage src={comment.user?.image || comment.user?.avatar} />
                                <AvatarFallback>{comment.user?.name?.[0] || "?"}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">{comment.user?.name || "Unknown User"}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                                        </span>
                                    </div>
                                    {currentUser?._id === comment.userId && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDelete(comment._id)}
                                        >
                                            <Trash2 className="w-3 h-3 text-red-500" />
                                        </Button>
                                    )}
                                </div>
                                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                    {comment.content}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="p-4 border-t bg-slate-50 dark:bg-slate-900">
                <div className="flex gap-2">
                    <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write a comment..."
                        className="min-h-[80px] resize-none"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                    />
                    <div className="flex flex-col gap-2">
                        <Button size="icon" onClick={handleSubmit} disabled={!newComment.trim()}>
                            <Send className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Attach file (coming soon)">
                            <Paperclip className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
