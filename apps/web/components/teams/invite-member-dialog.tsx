"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, Users } from "lucide-react";

const dict = {
    title: "Покани Член в Екипа",
    description: "Изберете потребител и определете ролята му",
    userLabel: "Потребител",
    userPlaceholder: "Изберете потребител...",
    roleLabel: "Роля",
    rolePlaceholder: "Изберете роля...",
    roles: {
        admin: "Администратор",
        member: "Член",
    },
    roleDescriptions: {
        admin: "Може да управлява екипа и да кани други",
        member: "Може да вижда и участва в проекти",
    },
    cancel: "Отказ",
    invite: "Покани",
    inviting: "Изпращане...",
    noUsers: "Няма налични потребители",
    noUsersDescription: "Всички потребители вече са в екипа",
    success: "Поканата е изпратена успешно",
};

const formSchema = z.object({
    userId: z.string().min(1, "Изберете потребител"),
    role: z.enum(["admin", "member"]),
});

type FormData = z.infer<typeof formSchema>;

interface InviteMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    teamId: string;
}

export function InviteMemberDialog({
    open,
    onOpenChange,
    teamId,
}: InviteMemberDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const addMember = useMutation(api.teams.addMember);

    // Get all users
    const allUsers = useQuery(api.users.list, {});
    // Get current team members
    const teamMembers = useQuery(api.teams.getMembers, { teamId });

    // Filter out users already in team
    const availableUsers = allUsers?.filter((user) => {
        const isMember = teamMembers?.some((m) => m.userId === user._id);
        return !isMember;
    });

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            userId: "",
            role: "member",
        },
    });

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            await addMember({
                teamId: teamId,
                userId: data.userId as Id<"users">,
                role: data.role,
            });
            form.reset();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to invite member:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        {dict.title}
                    </DialogTitle>
                    <DialogDescription>{dict.description}</DialogDescription>
                </DialogHeader>

                {!availableUsers || availableUsers.length === 0 ? (
                    <div className="py-8 text-center">
                        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="font-medium">{dict.noUsers}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            {dict.noUsersDescription}
                        </p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() => onOpenChange(false)}
                        >
                            {dict.cancel}
                        </Button>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="userId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{dict.userLabel}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={dict.userPlaceholder} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <ScrollArea className="max-h-[200px]">
                                                    {availableUsers.map((user) => (
                                                        <SelectItem key={user._id} value={user._id}>
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarFallback className="text-xs">
                                                                        {user.name?.charAt(0) || "?"}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span>{user.name || user.email}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </ScrollArea>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{dict.roleLabel}</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={dict.rolePlaceholder} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="admin">
                                                    <div>
                                                        <div className="font-medium">{dict.roles.admin}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {dict.roleDescriptions.admin}
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="member">
                                                    <div>
                                                        <div className="font-medium">{dict.roles.member}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {dict.roleDescriptions.member}
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            {field.value === "admin"
                                                ? dict.roleDescriptions.admin
                                                : dict.roleDescriptions.member}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    {dict.cancel}
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    {isSubmitting ? dict.inviting : dict.invite}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
