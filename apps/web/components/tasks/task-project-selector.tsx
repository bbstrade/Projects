"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TaskProjectSelectorProps {
    taskId: Id<"tasks">;
    currentProjectId: Id<"projects">;
    readonly?: boolean;
}

export function TaskProjectSelector({ taskId, currentProjectId, readonly }: TaskProjectSelectorProps) {
    const [open, setOpen] = useState(false);

    // Get all projects - in real app might want to filter by team or permissions
    const projects = useQuery(api.projects.list) || [];

    const updateTask = useMutation(api.tasks.update);
    const getProject = useQuery(api.projects.get, { id: currentProjectId });

    const handleSelect = async (projectId: Id<"projects">) => {
        try {
            if (projectId === currentProjectId) {
                setOpen(false);
                return;
            }

            await updateTask({
                id: taskId,
                projectId: projectId,
            });
            setOpen(false);
            toast.success("Task moved to new project");
        } catch (error) {
            toast.error("Failed to move task");
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-auto py-2 px-3"
                    disabled={readonly}
                >
                    <div className="flex items-center gap-2 text-left overflow-hidden">
                        <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">
                            {getProject?.name || "Unknown Project"}
                        </span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search project..." />
                    <CommandList>
                        <CommandEmpty>No project found.</CommandEmpty>
                        <CommandGroup>
                            {projects.map((project) => (
                                <CommandItem
                                    key={project._id}
                                    value={project.name}
                                    onSelect={() => handleSelect(project._id)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            currentProjectId === project._id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-medium">{project.name}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
