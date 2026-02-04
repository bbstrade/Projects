"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, Plus, Tag, X, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const formSchema = z.object({
    name: z.string().min(3, "Името трябва да бъде поне 3 символа").max(100),
    description: z.string().max(5000).optional(),
    status: z.string(),
    priority: z.string(),
    endDate: z.date().optional(),
    color: z.string(),
});

interface CreateProjectDialogProps {
    teamId: string;
    project?: any; // For edit mode
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function CreateProjectDialog({
    teamId,
    project,
    trigger,
    open: controlledOpen,
    onOpenChange
}: CreateProjectDialogProps) {
    const [open, setOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : open;
    const handleOpenChange = isControlled ? onOpenChange : setOpen;

    const isEditMode = !!project;

    // Mutations
    const createProject = useMutation(api.projects.create);
    const updateProject = useMutation(api.projects.update);

    // Queries
    const teamMembers = useQuery(api.teams.getMembers, { teamId });
    const users = useQuery(api.users.list);

    // Local state for labels and team members
    const [labels, setLabels] = useState<string[]>([]);
    const [newLabel, setNewLabel] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [newMemberEmail, setNewMemberEmail] = useState("");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: project?.name || "",
            description: project?.description || "",
            status: project?.status || "active",
            priority: project?.priority || "medium",
            color: project?.color || "#3b82f6",
        },
    });

    // Reset form when project changes (edit mode)
    useEffect(() => {
        if (project) {
            form.reset({
                name: project.name,
                description: project.description || "",
                status: project.status,
                priority: project.priority,
                color: project.color || "#3b82f6",
                endDate: project.endDate ? new Date(project.endDate) : undefined,
            });
            setLabels(project.labels || []);
            setSelectedMembers(project.team_members || []);
        }
    }, [project, form]);

    // Get team members with user details
    const membersWithDetails = teamMembers?.map(member => {
        const user = users?.find(u => u._id === member.userId);
        return {
            ...member,
            user,
            displayName: user?.name || user?.email || "Unknown",
            email: user?.email || "",
        };
    }) || [];

    const handleAddLabel = () => {
        const trimmed = newLabel.trim();
        if (trimmed && !labels.includes(trimmed)) {
            setLabels([...labels, trimmed]);
            setNewLabel("");
        }
    };

    const handleRemoveLabel = (label: string) => {
        setLabels(labels.filter(l => l !== label));
    };

    const handleAddMemberByEmail = () => {
        const trimmed = newMemberEmail.trim();
        if (trimmed && !selectedMembers.includes(trimmed)) {
            setSelectedMembers([...selectedMembers, trimmed]);
            setNewMemberEmail("");
        }
    };

    const handleRemoveMember = (email: string) => {
        setSelectedMembers(selectedMembers.filter(m => m !== email));
    };

    const toggleMember = (email: string) => {
        if (selectedMembers.includes(email)) {
            setSelectedMembers(selectedMembers.filter(m => m !== email));
        } else {
            setSelectedMembers([...selectedMembers, email]);
        }
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            if (isEditMode && project._id) {
                await updateProject({
                    id: project._id,
                    name: values.name,
                    description: values.description,
                    status: values.status,
                    priority: values.priority,
                    endDate: values.endDate?.getTime(),
                    team_members: selectedMembers,
                });
                toast.success("Проектът е обновен успешно!");
            } else {
                await createProject({
                    teamId,
                    name: values.name,
                    description: values.description,
                    status: values.status,
                    priority: values.priority,
                    endDate: values.endDate?.getTime(),
                    team_members: selectedMembers,
                });
                toast.success("Проектът е създаден успешно!");
            }

            handleOpenChange?.(false);
            form.reset();
            setLabels([]);
            setSelectedMembers([]);
        } catch (error) {
            toast.error(isEditMode ? "Неуспешно обновяване на проект" : "Неуспешно създаване на проект");
            console.error(error);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {trigger ? (
                <DialogTrigger asChild>{trigger}</DialogTrigger>
            ) : (
                !isControlled && (
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Нов Проект
                        </Button>
                    </DialogTrigger>
                )
            )}
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? "Редактиране на проект" : "Създай Нов Проект"}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? "Обновете детайлите на проекта" : "Попълнете детайлите за да създадете нов проект"}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Basic Info Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Име на проект *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Въведете име на проекта" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Краен срок</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "d MMMM yyyy", { locale: bg })
                                                        ) : (
                                                            <span>Изберете дата</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    locale={bg}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Description */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Описание</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Опишете проекта..."
                                            className="resize-none"
                                            rows={4}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Properties Row */}
                        <div className="grid grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Статус</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Статус" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="active">Активен</SelectItem>
                                                <SelectItem value="on_hold">В изчакване</SelectItem>
                                                <SelectItem value="completed">Завършен</SelectItem>
                                                <SelectItem value="archived">Архивиран</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Приоритет</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Приоритет" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="low">Нисък</SelectItem>
                                                <SelectItem value="medium">Среден</SelectItem>
                                                <SelectItem value="high">Висок</SelectItem>
                                                <SelectItem value="critical">Критичен</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="color"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Цвят</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="color"
                                                    className="h-10 w-14 p-1 cursor-pointer"
                                                    {...field}
                                                />
                                                <Input
                                                    type="text"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    className="flex-1"
                                                    placeholder="#3b82f6"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Labels Section */}
                        <div className="space-y-2">
                            <FormLabel>Етикети ({labels.length})</FormLabel>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Добави етикет..."
                                    value={newLabel}
                                    onChange={(e) => setNewLabel(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddLabel();
                                        }
                                    }}
                                />
                                <Button type="button" variant="outline" size="icon" onClick={handleAddLabel}>
                                    <Tag className="h-4 w-4" />
                                </Button>
                            </div>
                            {labels.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {labels.map((label) => (
                                        <Badge key={label} variant="secondary" className="flex items-center gap-1">
                                            <Tag className="h-3 w-3" />
                                            {label}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveLabel(label)}
                                                className="ml-1 hover:text-destructive"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Team Members Section */}
                        <div className="space-y-2">
                            <FormLabel>Членове на екипа ({selectedMembers.length})</FormLabel>

                            {/* Manual email add */}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Добави член по email..."
                                    value={newMemberEmail}
                                    onChange={(e) => setNewMemberEmail(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddMemberByEmail();
                                        }
                                    }}
                                />
                                <Button type="button" variant="outline" size="icon" onClick={handleAddMemberByEmail}>
                                    <UserPlus className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Selected members badges */}
                            {selectedMembers.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedMembers.map((email) => (
                                        <Badge key={email} variant="outline" className="flex items-center gap-1">
                                            {email}
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveMember(email)}
                                                className="ml-1 hover:text-destructive"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {/* Team members list */}
                            {membersWithDetails.length > 0 && (
                                <ScrollArea className="h-40 border rounded-md p-2 mt-2">
                                    <div className="space-y-2">
                                        {membersWithDetails.map((member) => (
                                            <div
                                                key={member._id}
                                                className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer"
                                                onClick={() => toggleMember(member.email)}
                                            >
                                                <Checkbox
                                                    checked={selectedMembers.includes(member.email)}
                                                    onCheckedChange={() => toggleMember(member.email)}
                                                />
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={member.user?.avatar} />
                                                    <AvatarFallback>
                                                        {member.displayName.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm">{member.displayName}</span>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => handleOpenChange?.(false)}>
                                Отказ
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting
                                    ? "Запазване..."
                                    : isEditMode
                                        ? "Актуализирай проект"
                                        : "Създай проект"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
