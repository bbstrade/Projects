"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id, Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Plus,
    X,
    Edit3,
    Save,
    ChevronDown,
    ListChecks,
    GripVertical,
    CheckSquare,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskSubtasksProps {
    taskId: Id<"tasks">;
}

export function TaskSubtasks({ taskId }: TaskSubtasksProps) {
    const subtasks = useQuery(api.subtasks.list, { taskId });
    const users = useQuery(api.users.list, {});
    const createSubtask = useMutation(api.subtasks.create);
    const updateSubtask = useMutation(api.subtasks.update);
    const removeSubtask = useMutation(api.subtasks.remove);

    // Form state
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [newLabels, setNewLabels] = useState<string[]>([]);
    const [newLabelInput, setNewLabelInput] = useState("");
    const [newAssigneeId, setNewAssigneeId] = useState<string>("");
    const [isAdding, setIsAdding] = useState(false);

    // Editing state
    const [editingId, setEditingId] = useState<Id<"subtasks"> | null>(null);
    const [editData, setEditData] = useState({
        title: "",
        description: "",
        labels: [] as string[],
        assigneeId: "",
    });
    const [editLabelInput, setEditLabelInput] = useState("");

    // Expand/collapse state
    const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});

    if (subtasks === undefined) return <div>Зареждане...</div>;

    // Calculate progress
    const completedCount = subtasks.filter((st) => st.completed).length;
    const totalCount = subtasks.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    const handleAddSubtask = async () => {
        if (!newTitle.trim()) return;

        try {
            await createSubtask({
                taskId,
                title: newTitle,
                description: newDescription || undefined,
                labels: newLabels.length > 0 ? newLabels : undefined,
                assigneeId: newAssigneeId ? (newAssigneeId as Id<"users">) : undefined,
            });
            // Reset form
            setNewTitle("");
            setNewDescription("");
            setNewLabels([]);
            setNewAssigneeId("");
            setIsAdding(false);
            toast.success("Подзадачата е добавена");
        } catch (error) {
            toast.error("Грешка при създаване на подзадача");
        }
    };

    const handleToggleSubtask = async (subtaskId: Id<"subtasks">, currentCompleted: boolean) => {
        await updateSubtask({
            id: subtaskId,
            completed: !currentCompleted,
        });
    };

    const handleRemoveSubtask = async (subtaskId: Id<"subtasks">) => {
        if (!confirm("Сигурни ли сте?")) return;
        await removeSubtask({ id: subtaskId });
        toast.success("Подзадачата е премахната");
    };

    const startEditing = (subtask: Doc<"subtasks">) => {
        setEditingId(subtask._id);
        setEditData({
            title: subtask.title,
            description: subtask.description || "",
            labels: subtask.labels || [],
            assigneeId: subtask.assigneeId || "",
        });
    };

    const saveEditing = async () => {
        if (!editingId || !editData.title.trim()) return;

        await updateSubtask({
            id: editingId,
            title: editData.title,
            description: editData.description || undefined,
            labels: editData.labels.length > 0 ? editData.labels : undefined,
            assigneeId: editData.assigneeId ? (editData.assigneeId as Id<"users">) : undefined,
        });
        setEditingId(null);
        toast.success("Подзадачата е обновена");
    };

    const cancelEditing = () => {
        setEditingId(null);
    };

    const toggleExpand = (subtaskId: string) => {
        setExpandedSubtasks((prev) => ({
            ...prev,
            [subtaskId]: !prev[subtaskId],
        }));
    };

    // Label management
    const addLabel = (isEditing: boolean) => {
        const input = isEditing ? editLabelInput : newLabelInput;
        if (!input.trim()) return;

        if (isEditing) {
            setEditData((prev) => ({
                ...prev,
                labels: [...prev.labels, input.trim()],
            }));
            setEditLabelInput("");
        } else {
            setNewLabels((prev) => [...prev, input.trim()]);
            setNewLabelInput("");
        }
    };

    const removeLabel = (label: string, isEditing: boolean) => {
        if (isEditing) {
            setEditData((prev) => ({
                ...prev,
                labels: prev.labels.filter((l) => l !== label),
            }));
        } else {
            setNewLabels((prev) => prev.filter((l) => l !== label));
        }
    };

    // Checklist management
    const handleAddChecklistItem = async (subtaskId: Id<"subtasks">, subtask: Doc<"subtasks">) => {
        const newItem = {
            id: crypto.randomUUID(),
            text: "",
            completed: false,
        };
        const updatedChecklist = [...(subtask.checklist || []), newItem];
        await updateSubtask({
            id: subtaskId,
            checklist: updatedChecklist,
        });
        setExpandedSubtasks((prev) => ({ ...prev, [subtaskId]: true }));
    };

    const handleUpdateChecklistItem = async (
        subtaskId: Id<"subtasks">,
        subtask: Doc<"subtasks">,
        itemId: string,
        newText: string
    ) => {
        const updatedChecklist = (subtask.checklist || []).map((item) =>
            item.id === itemId ? { ...item, text: newText } : item
        );
        await updateSubtask({
            id: subtaskId,
            checklist: updatedChecklist,
        });
    };

    const handleToggleChecklistItem = async (
        subtaskId: Id<"subtasks">,
        subtask: Doc<"subtasks">,
        itemId: string
    ) => {
        const updatedChecklist = (subtask.checklist || []).map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        await updateSubtask({
            id: subtaskId,
            checklist: updatedChecklist,
        });
    };

    const handleRemoveChecklistItem = async (
        subtaskId: Id<"subtasks">,
        subtask: Doc<"subtasks">,
        itemId: string
    ) => {
        const updatedChecklist = (subtask.checklist || []).filter((item) => item.id !== itemId);
        await updateSubtask({
            id: subtaskId,
            checklist: updatedChecklist,
        });
    };

    const getAssignee = (assigneeId: Id<"users"> | undefined) => {
        if (!assigneeId || !users) return null;
        return users.find((u) => u._id === assigneeId);
    };

    return (
        <div className="space-y-4">
            {/* Header with Progress */}
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <CheckSquare className="w-5 h-5" /> Подзадачи
                    </h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {completedCount}/{totalCount}
                    </span>
                </div>
            </div>

            {/* Progress Bar */}
            {totalCount > 0 && (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Напредък</span>
                        <span className="font-medium">{Math.round(progress)}% завършено</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            )}

            {/* Subtasks List */}
            <div className="space-y-2 mt-4">
                {subtasks.length > 0 ? (
                    subtasks.map((subtask) => {
                        const isEditing = editingId === subtask._id;
                        const isExpanded = expandedSubtasks[subtask._id];
                        const assignee = getAssignee(subtask.assigneeId);
                        const checklistCount = subtask.checklist?.length || 0;
                        const checklistCompleted = subtask.checklist?.filter((c) => c.completed).length || 0;

                        return (
                            <div
                                key={subtask._id}
                                className="border rounded-lg bg-card overflow-hidden"
                            >
                                {isEditing ? (
                                    /* Edit Mode */
                                    <div className="p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
                                        <Input
                                            value={editData.title}
                                            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                            autoFocus
                                        />
                                        <Textarea
                                            value={editData.description}
                                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                            rows={2}
                                            placeholder="Описание"
                                        />

                                        {/* Labels Edit */}
                                        <div className="space-y-2">
                                            <div className="flex gap-2 flex-wrap">
                                                {editData.labels.map((label) => (
                                                    <Badge key={label} variant="secondary" className="gap-1">
                                                        {label}
                                                        <X
                                                            className="h-3 w-3 cursor-pointer hover:text-destructive"
                                                            onClick={() => removeLabel(label, true)}
                                                        />
                                                    </Badge>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Нов етикет..."
                                                    value={editLabelInput}
                                                    onChange={(e) => setEditLabelInput(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLabel(true))}
                                                    className="flex-1"
                                                />
                                                <Button type="button" size="icon" variant="outline" onClick={() => addLabel(true)}>
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Assignee Edit */}
                                        <Select
                                            value={editData.assigneeId || "unassigned"}
                                            onValueChange={(val) => setEditData({ ...editData, assigneeId: val === "unassigned" ? "" : val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Без отговорник" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="unassigned">Без отговорник</SelectItem>
                                                {users?.map((user) => (
                                                    <SelectItem key={user._id} value={user._id}>
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-5 w-5">
                                                                <AvatarImage src={user.avatar} />
                                                                <AvatarFallback className="text-[10px]">
                                                                    {user.name?.charAt(0)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            {user.name || user.email}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={cancelEditing}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <X className="h-4 w-4 mr-1" />
                                                Отказ
                                            </Button>
                                            <Button size="sm" onClick={saveEditing} className="bg-green-600 hover:bg-green-700">
                                                <Save className="h-4 w-4 mr-1" />
                                                Запази
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Normal View */
                                    <>
                                        <div className="flex items-start gap-3 p-3 group">
                                            <GripVertical className="w-4 h-4 text-muted-foreground/30 cursor-move opacity-0 group-hover:opacity-100 mt-1" />
                                            <Checkbox
                                                checked={subtask.completed}
                                                onCheckedChange={() => handleToggleSubtask(subtask._id, subtask.completed)}
                                                className="mt-1"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span
                                                        className={cn(
                                                            "font-medium",
                                                            subtask.completed && "line-through text-muted-foreground"
                                                        )}
                                                    >
                                                        {subtask.title}
                                                    </span>
                                                    {checklistCount > 0 && (
                                                        <Badge variant="outline" className="text-[10px] py-0 h-5 gap-1">
                                                            <ListChecks className="h-3 w-3" />
                                                            {checklistCompleted}/{checklistCount}
                                                        </Badge>
                                                    )}
                                                </div>
                                                {subtask.description && (
                                                    <p
                                                        className={cn(
                                                            "text-sm text-muted-foreground line-clamp-2 mt-1",
                                                            subtask.completed && "opacity-50"
                                                        )}
                                                    >
                                                        {subtask.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                    {assignee && (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Avatar className="h-4 w-4">
                                                                <AvatarImage src={assignee.avatar} />
                                                                <AvatarFallback className="text-[8px]">
                                                                    {assignee.name?.charAt(0)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            {assignee.name}
                                                        </div>
                                                    )}
                                                    {subtask.labels?.map((label) => (
                                                        <Badge key={label} variant="secondary" className="text-[10px] py-0">
                                                            {label}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    onClick={() => startEditing(subtask)}
                                                >
                                                    <Edit3 className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    onClick={() => toggleExpand(subtask._id)}
                                                >
                                                    <ChevronDown
                                                        className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-180")}
                                                    />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                                    onClick={() => handleRemoveSubtask(subtask._id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Checklist Section */}
                                        {isExpanded && (
                                            <div className="bg-slate-100 dark:bg-slate-900 border-t p-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                                        <ListChecks className="h-3 w-3" />
                                                        ЧЕКЛИСТ
                                                    </span>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 text-xs"
                                                        onClick={() => handleAddChecklistItem(subtask._id, subtask)}
                                                    >
                                                        <Plus className="h-3 w-3 mr-1" />
                                                        Нова точка
                                                    </Button>
                                                </div>

                                                {subtask.checklist && subtask.checklist.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {subtask.checklist.map((item) => (
                                                            <div
                                                                key={item.id}
                                                                className="flex items-center gap-2 group/item"
                                                            >
                                                                <Checkbox
                                                                    checked={item.completed}
                                                                    onCheckedChange={() =>
                                                                        handleToggleChecklistItem(subtask._id, subtask, item.id)
                                                                    }
                                                                />
                                                                <Input
                                                                    value={item.text}
                                                                    placeholder="Описание..."
                                                                    onChange={(e) =>
                                                                        handleUpdateChecklistItem(
                                                                            subtask._id,
                                                                            subtask,
                                                                            item.id,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    className={cn(
                                                                        "h-7 text-sm flex-1 bg-transparent border-none shadow-none focus-visible:ring-0",
                                                                        item.completed && "line-through text-muted-foreground"
                                                                    )}
                                                                />
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-6 w-6 opacity-0 group-hover/item:opacity-100 text-destructive hover:text-destructive"
                                                                    onClick={() =>
                                                                        handleRemoveChecklistItem(subtask._id, subtask, item.id)
                                                                    }
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAddChecklistItem(subtask._id, subtask)}
                                                        className="w-full py-3 border-2 border-dashed rounded-lg text-sm text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                                                    >
                                                        + Добави първа точка към чеклиста
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <ListChecks className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Няма добавени подзадачи.</p>
                    </div>
                )}
            </div>

            {/* Add Subtask Form */}
            {isAdding ? (
                <div className="border rounded-lg p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
                    <Input
                        placeholder="Заглавие на подзадачата..."
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        autoFocus
                    />
                    <Textarea
                        placeholder="Описание (опционално)"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        rows={2}
                    />

                    {/* Labels */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Етикети</label>
                        <div className="flex gap-2 flex-wrap">
                            {newLabels.map((label) => (
                                <Badge key={label} variant="secondary" className="gap-1">
                                    {label}
                                    <X
                                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                                        onClick={() => removeLabel(label, false)}
                                    />
                                </Badge>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Нов етикет..."
                                value={newLabelInput}
                                onChange={(e) => setNewLabelInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLabel(false))}
                                className="flex-1"
                            />
                            <Button type="button" size="icon" variant="outline" onClick={() => addLabel(false)}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Assignee */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Отговорник</label>
                        <Select value={newAssigneeId || "unassigned"} onValueChange={(val) => setNewAssigneeId(val === "unassigned" ? "" : val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Без отговорник" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassigned">Без отговорник</SelectItem>
                                {users?.map((user) => (
                                    <SelectItem key={user._id} value={user._id}>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-5 w-5">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback className="text-[10px]">
                                                    {user.name?.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            {user.name || user.email}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setIsAdding(false)}>
                            Отказ
                        </Button>
                        <Button onClick={handleAddSubtask} disabled={!newTitle.trim()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Добави
                        </Button>
                    </div>
                </div>
            ) : (
                <Button variant="outline" className="w-full" onClick={() => setIsAdding(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Нова подзадача
                </Button>
            )}
        </div>
    );
}
