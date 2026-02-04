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
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [switching, setSwitching] = useState(false);

    const user = useQuery(api.users.me);
    const teams = useQuery(api.teams.list, { view: "my" }); // List only my teams for switching
    // We also need the user's role in each team. querying memberships or doing a clever mapping.
    // Ideally `teams.list` or `teams.listForUser` should return role.
    // For now, we will fetch memberships separately or assume basic info.
    // Actually, `teams.list` returns team objects. Let's optimize by fetching memberships too to show roles.

    // Better yet, let's use `api.teams.listForUser` but that returns just teams.
    // Let's rely on `teams` query for now and maybe fetch memberships if needed for "Role" badge in list. 
    // To make it simple and fast, we won't show role in the dropdown list immediately if it's expensive, 
    // but we SHOULD show role for the *current* team. 

    // We need to know the role in the CURRENT team.
    const currentTeamMemberships = useQuery(api.teams.getMembers,
        user?.currentTeamId ? { teamId: user.currentTeamId } : "skip" // convex requires skip token or conditional
    );

    // Workaround for conditional query if "skip" isn't supported directly this way in this version of convex-react types?
    // Actually Convex usually supports skip or "skip". If not, we handle null.

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

    // Only show switcher if user has teams (or allow them to see "No Team" state)
    // If 0 teams, maybe just show a "Create Team" button or similar?
    // But this component replaces the header title usually.

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    aria-label="Select a team"
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
                            Изберете екип
                        </span>
                    )}
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-0">
                <Command>
                    <CommandList>
                        <CommandInput placeholder="Търсене на екип..." />
                        <CommandEmpty>Няма намерени екипи.</CommandEmpty>
                        <CommandGroup heading="Моите екипи">
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
                                                window.location.reload(); // Hard reload to clear all query state if needed, or query invalidation happens automatically
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
                                router.push("/teams"); // Redirect to team management to create
                            }}
                            className="border-t text-blue-600 cursor-pointer"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Създай нов екип
                        </CommandItem>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
