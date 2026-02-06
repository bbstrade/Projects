"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    Link2,
    ArrowRight,
    AlertTriangle,
    Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskDependenciesProps {
    taskId: Id<"tasks">;
    projectId: Id<"projects">;
}

const DEPENDENCY_TYPES = [
    { value: "FS", label: "Finish-to-Start", description: "Тази задача започва след приключване на избраната" },
    { value: "SS", label: "Start-to-Start", description: "Двете задачи започват заедно" },
    { value: "FF", label: "Finish-to-Finish", description: "Двете задачи завършват заедно" },
    { value: "SF", label: "Start-to-Finish", description: "Избраната задача трябва да започне преди тази да завърши" },
];

export function TaskDependencies({ taskId, projectId }: TaskDependenciesProps) {
    const dependencies = useQuery(api.dependencies.list, { taskId });
    const projectTasks = useQuery(api.tasks.list, { projectId });
    const addDependency = useMutation(api.dependencies.add);
    const removeDependency = useMutation(api.dependencies.remove);

    const [isAdding, setIsAdding] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string>("");
    const [selectedType, setSelectedType] = useState<string>("FS");
    const [isLegendOpen, setIsLegendOpen] = useState(false);

    // Filter out current task and already added dependencies
    const availableTasks = projectTasks?.filter((task) => {
        if (task._id === taskId) return false;
        if (dependencies?.some((dep) => dep.dependsOnTaskId === task._id)) return false;
        return true;
    }) || [];

    const handleAddDependency = async () => {
        if (!selectedTaskId) return;

        try {
            await addDependency({
                taskId,
                dependsOnTaskId: selectedTaskId as Id<"tasks">,
                type: selectedType,
            });
            setIsAdding(false);
            setSelectedTaskId("");
            setSelectedType("FS");
            toast.success("Зависимостта е добавена");
        } catch (error: any) {
            toast.error(error.message || "Грешка при добавяне на зависимост");
        }
    };

    const handleRemoveDependency = async (dependencyId: Id<"taskDependencies">) => {
        if (!confirm("Сигурни ли сте?")) return;
        await removeDependency({ id: dependencyId });
        toast.success("Зависимостта е премахната");
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "FS": return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300";
            case "SS": return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
            case "FF": return "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300";
            case "SF": return "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300";
            default: return "bg-slate-100 text-slate-700";
        }
    };

    const getTypeLabel = (type: string) => {
        return DEPENDENCY_TYPES.find((t) => t.value === type)?.label || type;
    };

    if (dependencies === undefined) return <div>Зареждане...</div>;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Link2 className="w-5 h-5" /> Зависимости
                    </h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {dependencies.length}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs ml-2 text-muted-foreground"
                        onClick={() => setIsLegendOpen(!isLegendOpen)}
                    >
                        <Info className="h-3 w-3 mr-1" />
                        Легенда
                    </Button>
                </div>
            </div>

            {/* Dependencies List */}
            <div className="space-y-2">
                {dependencies.length > 0 ? (
                    dependencies.map((dep) => (
                        <div
                            key={dep._id}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-card group hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Badge className={cn("text-[10px] font-mono", getTypeColor(dep.type))}>
                                    {dep.type}
                                </Badge>
                                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <span className="font-medium truncate block">
                                        {dep.dependsOnTask?.title || "Неизвестна задача"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {getTypeLabel(dep.type)}
                                    </span>
                                </div>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                onClick={() => handleRemoveDependency(dep._id)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/30">
                        <Link2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p className="font-medium">Няма зависимости</p>
                        <p className="text-sm mt-1">
                            Добавете зависимости за да определите реда на изпълнение
                        </p>
                    </div>
                )}
            </div>

            {/* Add Dependency Form */}
            {isAdding ? (
                <div className="border rounded-lg p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Зависи от задача</label>
                        <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Изберете задача..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableTasks.length > 0 ? (
                                    availableTasks.map((task) => (
                                        <SelectItem key={task._id} value={task._id}>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-[10px] py-0",
                                                        task.status === "done" && "bg-green-100 text-green-700"
                                                    )}
                                                >
                                                    {task.status}
                                                </Badge>
                                                <span className="truncate">{task.title}</span>
                                            </div>
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="p-3 text-center text-muted-foreground text-sm">
                                        <AlertTriangle className="h-4 w-4 mx-auto mb-1" />
                                        Няма налични задачи
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Тип зависимост</label>
                        <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {DEPENDENCY_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        <div className="flex items-center gap-2">
                                            <Badge className={cn("font-mono", getTypeColor(type.value))}>
                                                {type.value}
                                            </Badge>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{type.label}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {type.description}
                                                </span>
                                            </div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsAdding(false);
                                setSelectedTaskId("");
                                setSelectedType("FS");
                            }}
                        >
                            Отказ
                        </Button>
                        <Button onClick={handleAddDependency} disabled={!selectedTaskId}>
                            <Plus className="h-4 w-4 mr-2" />
                            Добави
                        </Button>
                    </div>
                </div>
            ) : (
                <Button variant="outline" className="w-full" onClick={() => setIsAdding(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добави зависимост
                </Button>
            )}

            {/* Legend */}
            {isLegendOpen && (
                <div className="text-xs text-muted-foreground space-y-1 mt-4 p-3 bg-muted/50 rounded-lg animate-in fade-in slide-in-from-top-1">
                    <p className="font-semibold mb-2">Типове зависимости:</p>
                    {DEPENDENCY_TYPES.map((type) => (
                        <div key={type.value} className="flex items-center gap-2">
                            <Badge className={cn("font-mono text-[10px]", getTypeColor(type.value))}>
                                {type.value}
                            </Badge>
                            <span>{type.description}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
