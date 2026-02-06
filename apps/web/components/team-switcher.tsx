"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Check, ChevronsUpDown, Building2, PlusCircle, Crown, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

const roleIcons: Record<string, React.ReactNode> = {
    owner: <Crown className="ml-auto h-4 w-4 text-amber-500" />,
    admin: <Shield className="ml-auto h-4 w-4 text-blue-500" />,
    member: <User className="ml-auto h-4 w-4 text-slate-500" />,
};

const roleLabels: Record<string, string> = {
    owner: "Owner",
    admin: "Admin",
    member: "Member",
};

export function TeamSwitcher() {
    const { t } = useLanguage();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [switching, setSwitching] = useState(false);

    const roleLabels: Record<string, string> = {
        owner: t("roleOwner"),
        admin: t("roleAdmin"),
        member: t("roleMember"),
    };

    const user = useQuery(api.users.me);
    const teams = useQuery(api.teams.list, { view: "my" });

    const currentTeamMemberships = useQuery(api.teams.getMembers,
        user?.currentTeamId ? { teamId: user.currentTeamId } : "skip"
    );

    const switchTeam = useMutation(api.users.switchTeam);

    // Get current team details
    const currentTeam = teams?.find((t) => t._id === user?.currentTeamId);

    // Auto-assign logic
    useEffect(() => {
        if (!user || !teams) return;

        if (!user.currentTeamId && teams.length > 0 && !switching) {
            // Auto switch to first team
            const firstTeam = teams[0];
            setSwitching(true);
            switchTeam({ teamId: firstTeam._id as string })
                .then(() => {
                    // Success
                })
                .catch(console.error)
                .finally(() => setSwitching(false));
        }
    }, [user, teams, switching, switchTeam]);

    // Derived current role
    const currentRole = user?.currentTeamId && currentTeamMemberships
        ? currentTeamMemberships.find(m => m.userId === user._id)?.role
        : null;

    if (!user || !teams) {
        return <div className="h-10 w-[200px] animate-pulse rounded bg-muted" />;
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-label={t("selectTeam")}
                    className="w-[240px] justify-between border-dashed hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                    {currentTeam ? (
                        <div className="flex items-center gap-2 text-left truncate">
                            <Avatar className="h-5 w-5 bg-blue-100">
                                <AvatarFallback className="text-[10px] text-blue-700">
                                    {currentTeam.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-0.5 overflow-hidden">
                                <span className="truncate text-sm font-medium">{currentTeam.name}</span>
                            </div>
                        </div>
                    ) : (
                        <span className="text-muted-foreground flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {t("selectTeam")}
                        </span>
                    )}
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-0">
                <Command>
                    <CommandList>
                        <CommandInput placeholder={t("searchTeam")} />
                        <CommandEmpty>{t("noTeamsFound")}</CommandEmpty>
                        <CommandGroup heading={t("myTeamsTitle")}>
                            {teams.map((team) => (
                                <CommandItem
                                    key={team._id}
                                    onSelect={() => {
                                        if (team._id === user.currentTeamId) {
                                            setOpen(false);
                                            return;
                                        }
                                        setSwitching(true);
                                        switchTeam({ teamId: team._id as string })
                                            .then(() => {
                                                setOpen(false);
                                                window.location.reload();
                                            })
                                            .finally(() => setSwitching(false));
                                    }}
                                    className="text-sm"
                                >
                                    <Building2 className={cn("mr-2 h-4 w-4",
                                        team._id === user.currentTeamId ? "text-blue-500" : "text-muted-foreground"
                                    )} />
                                    <div className="flex flex-col">
                                        <span>{team.name}</span>
                                        {team.role && (
                                            <span className="text-[10px] text-muted-foreground capitalize">
                                                {roleLabels[team.role === "system_admin" ? "admin" : team.role] || team.role}
                                            </span>
                                        )}
                                    </div>
                                    {team._id === user.currentTeamId && (
                                        <Check className="ml-auto h-4 w-4 text-blue-500" />
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandItem
                            onSelect={() => {
                                setOpen(false);
                                router.push("/teams");
                            }}
                            className="border-t text-blue-600 cursor-pointer"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t("createTeam")}
                        </CommandItem>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
