"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Trash2, UserPlus, Mail } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ProjectTeamProps {
    projectId: Id<"projects">;
}

export function ProjectTeam({ projectId }: ProjectTeamProps) {
    const project = useQuery(api.projects.get, { id: projectId });
    const users = useQuery(api.users.list);
    const updateTeamMembers = useMutation(api.projects.updateTeamMembers);
    const addTeamMember = useMutation(api.teams.addMember);
    const teamMembersFromDb = useQuery(api.teams.getMembers, project?.teamId ? { teamId: project.teamId } : "skip");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [manualEmail, setManualEmail] = useState("");
    const [selectedUserId, setSelectedUserId] = useState<string>("none");

    if (!project) return <div>Loading...</div>;

    // Merge project.team_members (strings) with actual user data if available
    const members = (project.team_members || []).map(memberStr => {
        // Check if this string matches a registered user's email or name
        const registeredUser = users?.find(u => u.email === memberStr || u.name === memberStr);
        // Or if it matches a team member details
        const teamMemberRecord = teamMembersFromDb?.find(tm => tm.user?.email === memberStr);

        return {
            original: memberStr,
            user: registeredUser || teamMemberRecord?.user,
            isRegistered: !!(registeredUser || teamMemberRecord?.user),
        };
    });

    const handleAddMember = async () => {
        try {
            let newMemberStr = "";

            if (selectedUserId !== "none") {
                const user = users?.find(u => u._id === selectedUserId);
                if (user) {
                    newMemberStr = user.email || user.name || "";
                    // Auto-add to TeamMember table as per requirements
                    if (project.teamId) {
                        try {
                            await addTeamMember({
                                teamId: project.teamId,
                                userId: user._id as Id<"users">,
                                role: "member"
                            });
                        } catch (e) {
                            // Ignore if already member
                            console.log("User might already be in team", e);
                        }
                    }
                }
            } else if (manualEmail) {
                newMemberStr = manualEmail;
            }

            if (!newMemberStr) {
                toast.error("Please select a user or enter an email");
                return;
            }

            const currentMembers = project.team_members || [];
            if (currentMembers.includes(newMemberStr)) {
                toast.error("Member already exists");
                return;
            }

            await updateTeamMembers({
                projectId,
                members: [...currentMembers, newMemberStr]
            });

            toast.success("Member added");
            setManualEmail("");
            setSelectedUserId("none");
            setIsDialogOpen(false);
        } catch (error) {
            toast.error("Failed to add member");
            console.error(error);
        }
    };

    const handleRemoveMember = async (memberStr: string) => {
        if (!confirm(`Remove ${memberStr} from project?`)) return;

        try {
            const currentMembers = project.team_members || [];
            const newMembers = currentMembers.filter(m => m !== memberStr);
            await updateTeamMembers({
                projectId,
                members: newMembers
            });
            toast.success("Member removed");
        } catch (error) {
            toast.error("Failed to remove member");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white dark:bg-slate-950 p-4 rounded-lg border border-border">
                <h3 className="font-semibold">Project Team</h3>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Add Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Team Member</DialogTitle>
                            <DialogDescription>
                                Add an existing user or manually enter an email/name.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Select Registered User</Label>
                                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select user..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {users?.filter(u => !project.team_members?.includes(u.email || "")).map(user => (
                                            <SelectItem key={user._id} value={user._id}>
                                                {user.name} ({user.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or manually</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Enter Name/Email</Label>
                                <Input
                                    placeholder="john@example.com"
                                    value={manualEmail}
                                    onChange={(e) => setManualEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button onClick={handleAddMember} className="w-full">Add to Project</Button>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No members yet.</p>}

                {members.map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-950 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={member.user?.image || member.user?.avatar} />
                                <AvatarFallback>{member.original[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium text-sm">{member.user?.name || member.original}</p>
                                <p className="text-xs text-muted-foreground">
                                    {member.isRegistered ? "Registered User" : "Manual Entry"}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveMember(member.original)}>
                            <Trash2 className="w-4 h-4 text-slate-500 hover:text-red-500" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
