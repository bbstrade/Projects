"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Users,
    Plus,
    Search,
    MoreVertical,
    Crown,
    UserPlus,
    Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateTeamDialog } from "@/components/teams/create-team-dialog";
import { InviteMemberDialog } from "@/components/teams/invite-member-dialog";
import { ManageTeamDialog } from "@/components/teams/manage-team-dialog";
import { useLanguage } from "@/components/language-provider";

const roleColors: Record<string, string> = {
    owner: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    admin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    member: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};

export default function TeamsPage() {
    const { t, lang } = useLanguage();
    const [searchQuery, setSearchQuery] = useState("");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [manageDialogOpen, setManageDialogOpen] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

    const currentUser = useQuery(api.users.me);
    const [adminViewAll, setAdminViewAll] = useState(false);

    // Only pass permissions view if user is admin
    const queryArgs = adminViewAll ? { view: "all" } : { view: "my" };
    const teams = useQuery(api.teams.list, queryArgs);

    const isAdmin = currentUser?.role === "admin";

    // filtering by searchQuery
    const filteredTeams = teams?.filter((team) =>
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleInviteMember = (teamId: string) => {
        setSelectedTeamId(teamId);
        setInviteDialogOpen(true);
    };

    return (
        <div className="space-y-6 p-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("teamsTitle")}</h1>
                    <p className="text-muted-foreground">{t("teamsSubtitle")}</p>
                </div>
                <div className="flex gap-2">
                    {isAdmin && (
                        <Button
                            variant={adminViewAll ? "default" : "outline"}
                            onClick={() => setAdminViewAll(!adminViewAll)}
                        >
                            {adminViewAll ? (lang === "bg" ? "Моите екипи" : "My Teams") : (lang === "bg" ? "Всички екипи (Admin)" : "All Teams (Admin)")}
                        </Button>
                    )}
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("newTeam")}
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={t("teamsSearchPlaceholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Teams Grid */}
            {!teams ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader>
                                <div className="h-6 w-32 bg-slate-200 rounded" />
                                <div className="h-4 w-48 bg-slate-100 rounded mt-2" />
                            </CardHeader>
                            <CardContent>
                                <div className="h-10 bg-slate-100 rounded" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredTeams && filteredTeams.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTeams.map((team) => (
                        <TeamCard
                            key={team._id}
                            team={team}
                            onInvite={() => handleInviteMember(team._id)}
                            onManage={() => {
                                setSelectedTeamId(team._id);
                                setManageDialogOpen(true);
                            }}
                        />
                    ))}
                </div>
            ) : (
                <Card className="p-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">{t("noTeams")}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t("noTeamsDescription")}
                    </p>
                    <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("newTeam")}
                    </Button>
                </Card>
            )}

            {/* Dialogs */}
            <CreateTeamDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
            />
            {selectedTeamId && (
                <InviteMemberDialog
                    open={inviteDialogOpen}
                    onOpenChange={setInviteDialogOpen}
                    teamId={selectedTeamId}
                />
            )}


            {selectedTeamId && (
                <ManageTeamDialog
                    open={manageDialogOpen}
                    onOpenChange={setManageDialogOpen}
                    teamId={selectedTeamId}
                />
            )}
        </div>
    );
}

// Team Card Component
function TeamCard({
    team,
    onInvite,
    onManage,
}: {
    team: {
        _id: string;
        name: string;
        description?: string;
    };
    onInvite: () => void;
    onManage: () => void;
}) {
    const { t } = useLanguage();
    const members = useQuery(api.teams.getMembers, { teamId: team._id });

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{team.name}</CardTitle>
                            <CardDescription className="line-clamp-1">
                                {team.description || (t("noDescription") || "No description")}
                            </CardDescription>
                        </div>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onInvite}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                {t("inviteMember")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onManage}>
                                <Settings className="mr-2 h-4 w-4" />
                                {t("settings")}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                            {members?.length || 0} {t("membersCount") || "members"}
                        </span>
                    </div>
                    {/* Member Avatars */}
                    <div className="flex -space-x-2">
                        {members?.slice(0, 4).map((member, index) => (
                            <Avatar key={member._id} className="h-8 w-8 border-2 border-background">
                                <AvatarFallback className="text-xs bg-slate-200">
                                    {member.user?.name?.charAt(0) || "?"}
                                </AvatarFallback>
                            </Avatar>
                        ))}
                        {(members?.length || 0) > 4 && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-slate-100 text-xs font-medium">
                                +{(members?.length || 0) - 4}
                            </div>
                        )}
                    </div>
                </div>

                {/* Member Badges */}
                {members && members.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {members.slice(0, 3).map((member) => (
                            <Badge
                                key={member._id}
                                variant="secondary"
                                className={roleColors[member.role] || roleColors.member}
                            >
                                {member.role === "owner" && <Crown className="mr-1 h-3 w-3" />}
                                {member.user?.name || "Unknown"}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

