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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, ChevronsUpDown, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TaskAssigneeSelectorProps {
    taskId: Id<"tasks">;
    projectId: Id<"projects">;
    currentAssigneeId?: Id<"users">;
    readonly?: boolean;
}

export function TaskAssigneeSelector({ taskId, projectId, currentAssigneeId, readonly }: TaskAssigneeSelectorProps) {
    const [open, setOpen] = useState(false);

    // 1. Get Project to find Team ID
    const project = useQuery(api.projects.get, { id: projectId });

    // 2. Get Team Members
    // We conditionally run this query only when we have a teamId
    const teamId = project?.teamId;
    const teamMembers = useQuery(api.teams.getMembers, teamId ? { teamId } : "skip");

    const updateTask = useMutation(api.tasks.update);

    // Get current assignee object from teamMembers if available
    const currentAssignee = teamMembers?.find(m => m.user?._id === currentAssigneeId)?.user;
    // Or if not in team members (e.g. removed), we might want to query user details directly?
    // For now, if not in list, we show what we have.
    // Actually, `currentAssigneeId` is passed, but maybe we want the name. 
    // The parent component might pass proper object or we derive it here.

    const handleSelect = async (userId: Id<"users">) => {
        try {
            await updateTask({
                id: taskId,
                assigneeId: userId,
            });
            setOpen(false);
            toast.success("Отговорникът е обновен");
        } catch (error) {
            toast.error("Грешка при обновяване на отговорника");
        }
    };

    if (!project) return <div className="h-10 w-full animate-pulse bg-muted rounded-md" />;

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
                    {currentAssigneeId ? (
                        <div className="flex items-center gap-2 text-left">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={currentAssignee?.image} />
                                <AvatarFallback>{currentAssignee?.name?.[0] || <User className="h-3 w-3" />}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium truncate leading-none mb-0.5">
                                    {currentAssignee?.name || "Unknown User"}
                                </span>
                                <span className="text-xs text-muted-foreground truncate leading-none">
                                    {currentAssignee?.email}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>Няма отговорник</span>
                        </div>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Търси член на екипа..." />
                    <CommandList>
                        <CommandEmpty>Няма намерени резултати.</CommandEmpty>
                        <CommandGroup>
                            {teamMembers?.map((member) => (
                                <CommandItem
                                    key={member.userId}
                                    value={member.user?.name || member.user?.email || ""}
                                    onSelect={() => {
                                        if (member.user?._id) handleSelect(member.user._id);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            currentAssigneeId === member.userId ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <Avatar className="h-6 w-6 mr-2">
                                        <AvatarImage src={member.user?.image} />
                                        <AvatarFallback>{member.user?.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{member.user?.name}</span>
                                        <span className="text-xs text-muted-foreground">{member.role}</span>
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
