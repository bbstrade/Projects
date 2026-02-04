"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Trash2, UserPlus, Shield } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface ProjectGuestsProps {
    projectId: Id<"projects">;
}

export function ProjectGuests({ projectId }: ProjectGuestsProps) {
    const { t } = useLanguage();
    const guests = useQuery(api.project_guests.list, { projectId });
    const inviteGuest = useMutation(api.project_guests.invite);
    const removeGuest = useMutation(api.project_guests.remove);
    const updateGuestPermissions = useMutation(api.project_guests.updatePermissions);
    const project = useQuery(api.projects.get, { id: projectId });
    const team = useQuery(api.teams.getByStringId, project?.teamId ? { teamId: project.teamId } : "skip");

    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [email, setEmail] = useState("");
    const [permissions, setPermissions] = useState<string[]>(["view"]);

    // Check if team allows guests
    if (team && team.settings?.allow_guest_users === false) {
        return (
            <div className="p-8 text-center text-muted-foreground border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <Shield className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t("guestAccessDisabled")}</h3>
                <p>{t("guestAccessDisabledDesc")}</p>
            </div>
        );
    }

    const availablePermissions = [
        { id: "view", label: t("permView") },
        { id: "comment", label: t("permComment") },
        { id: "edit_tasks", label: t("permEditTasks") },
        { id: "create_tasks", label: t("permCreateTasks") },
    ];

    const translateStatus = (status: string) => {
        const map: Record<string, string> = {
            active: t("statusActive"),
            pending: t("statusPending"),
            revoked: t("statusRevoked"),
        };
        return map[status] || status;
    };

    const handleInvite = async () => {
        if (!email) return;
        try {
            await inviteGuest({
                projectId,
                email,
                permissions,
            });
            toast.success(t("guestInvited"));
            setIsInviteOpen(false);
            setEmail("");
            setPermissions(["view"]);
        } catch (error: any) {
            toast.error(error.message || t("guestInviteError"));
        }
    };

    const handleTogglePermission = (permId: string) => {
        setPermissions(prev =>
            prev.includes(permId)
                ? prev.filter(p => p !== permId)
                : [...prev, permId]
        );
    };

    const handleRemove = async (id: Id<"projectGuests">) => {
        if (confirm(t("removeGuestConfirm"))) {
            await removeGuest({ id });
            toast.success(t("guestRemoved"));
        }
    };

    if (!guests) return <div>{t("loadingChecking")}</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-4 rounded-lg border border-border">
                <h3 className="font-semibold">{t("guestsTitle")}</h3>
                <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="w-4 h-4 mr-2" />
                            {t("inviteGuest")}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t("inviteExternalGuest")}</DialogTitle>
                            <DialogDescription>
                                {t("inviteGuestDesc")}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t("emailAddress")}</label>
                                <Input
                                    placeholder="guest@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">{t("permissions")}</label>
                                <div className="space-y-2 border rounded-md p-3">
                                    {availablePermissions.map((perm) => (
                                        <div key={perm.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`perm-${perm.id}`}
                                                checked={permissions.includes(perm.id)}
                                                onCheckedChange={() => handleTogglePermission(perm.id)}
                                            />
                                            <label htmlFor={`perm-${perm.id}`} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                {perm.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <Button onClick={handleInvite} className="w-full">{t("sendInvite")}</Button>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border bg-white dark:bg-slate-950">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("emailAddress")} / {t("name")}</TableHead>
                            <TableHead>{t("status")}</TableHead>
                            <TableHead>{t("permissions")}</TableHead>
                            <TableHead className="text-right">{t("actions")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {guests.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    {t("noGuests")}
                                </TableCell>
                            </TableRow>
                        )}
                        {guests.map((guest) => (
                            <TableRow key={guest._id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {guest.user ? guest.user.name : guest.email}
                                        </span>
                                        {guest.user && <span className="text-xs text-muted-foreground">{guest.email}</span>}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={guest.status === "active" ? "default" : "secondary"}>
                                        {translateStatus(guest.status)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {guest.permissions.map(p => (
                                            <Badge key={p} variant="outline" className="text-xs">
                                                {availablePermissions.find(ap => ap.id === p)?.label || p}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleRemove(guest._id)}>
                                        <Trash2 className="w-4 h-4 text-slate-500 hover:text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
