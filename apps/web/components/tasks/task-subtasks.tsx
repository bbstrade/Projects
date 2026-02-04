"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Trash2, Plus, GripVertical, CheckSquare } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider"; // Using generic useLanguage for now, will add keys later

interface TaskSubtasksProps {
    taskId: Id<"tasks">;
}

export function TaskSubtasks({ taskId }: TaskSubtasksProps) {
    const subtasks = useQuery(api.subtasks.list, { taskId });
    const createSubtask = useMutation(api.subtasks.create);
    const updateSubtask = useMutation(api.subtasks.update);
    const removeSubtask = useMutation(api.subtasks.remove);

    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    if (subtasks === undefined) return <div>Loading subtasks...</div>;

    const completedCount = subtasks.filter(s => s.completed).length;
    const progress = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

    const handleAddSubtask = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newSubtaskTitle.trim()) return;

        try {
            await createSubtask({
                taskId,
                title: newSubtaskTitle,
            });
            setNewSubtaskTitle("");
            setIsAdding(false);
            toast.success("Subtask added");
        } catch (error) {
            toast.error("Failed to add subtask");
        }
    };

    const handleToggleComplete = async (id: Id<"subtasks">, completed: boolean) => {
        await updateSubtask({ id, completed });
    };

    const handleDelete = async (id: Id<"subtasks">) => {
        await removeSubtask({ id });
        toast.success("Subtask removed");
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <CheckSquare className="w-5 h-5" /> Subtasks
                    </h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {completedCount}/{subtasks.length}
                    </span>
                </div>
            </div>

            {subtasks.length > 0 && (
                <Progress value={progress} className="h-2" />
            )}

            <div className="space-y-2 mt-4">
                {subtasks.map((subtask) => (
                    <div key={subtask._id} className="group flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                        <GripVertical className="w-4 h-4 text-muted-foreground/30 cursor-move opacity-0 group-hover:opacity-100" />
                        <Checkbox
                            checked={subtask.completed}
                            onCheckedChange={(checked) => handleToggleComplete(subtask._id, checked as boolean)}
                        />
                        <div className={`flex-1 text-sm ${subtask.completed ? "line-through text-muted-foreground" : ""}`}>
                            {subtask.title}
                        </div>
                        {/* Placeholder for assignee avatar */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDelete(subtask._id)}
                        >
                            <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-500" />
                        </Button>
                    </div>
                ))}
            </div>

            {isAdding ? (
                <form onSubmit={handleAddSubtask} className="flex gap-2 mt-2">
                    <Input
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        placeholder="What needs to be done?"
                        autoFocus
                        className="h-8 text-sm"
                    />
                    <Button type="submit" size="sm" className="h-8">Add</Button>
                    <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setIsAdding(false)}>Cancel</Button>
                </form>
            ) : (
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground hover:text-foreground mt-2"
                    onClick={() => setIsAdding(true)}
                >
                    <Plus className="w-4 h-4 mr-2" /> Add subtask
                </Button>
            )}
        </div>
    );
}
