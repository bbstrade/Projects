"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Camera, Loader2, Save, User } from "lucide-react";

export default function ProfileTab() {
    const { data: session } = useSession();
    const user = useQuery(api.users.me);
    const updateProfile = useMutation(api.settings.updateProfile);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);

    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
        } else if (session?.user) {
            setName(session.user.name || "");
        }
    }, [user, session]);

    const handleSave = async () => {
        if (!user?._id) return;
        setIsSubmitting(true);
        try {
            await updateProfile({
                userId: user._id,
                name: name,
            });
            toast.success("Profile updated successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size must be less than 5MB");
            return;
        }

        setUploading(true);
        try {
            // 1. Get upload URL
            const postUrl = await generateUploadUrl();

            // 2. Upload file
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) throw new Error("Upload failed");
            const { storageId } = await result.json();

            // The backend `users.me` query automatically converts storage ID to URL
            await updateProfile({
                userId: user!._id,
                imageUrl: storageId // We pass storageId, but argument name is imageUrl in mutation
            });

            toast.success("Профилната снимка е обновена");
        } catch (error) {
            console.error(error);
            toast.error("Неуспешно качване на снимка");
        } finally {
            setUploading(false);
        }
    };

    if (!user) return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
            <CardHeader className="pb-4 border-b">
                <CardTitle className="text-xl">Лична информация</CardTitle>
                <CardDescription>Управлявайте личните си данни и предпочитания</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 pt-6">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative group">
                            <Avatar className="h-32 w-32 border-4 border-muted shadow-sm">
                                <AvatarImage src={user.avatar} className="object-cover" />
                                <AvatarFallback className="text-4xl bg-muted">{user.name?.charAt(0) || "U"}</AvatarFallback>
                            </Avatar>
                            <Label
                                htmlFor="avatar-upload"
                                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer backdrop-blur-sm"
                            >
                                <Camera className="h-8 w-8" />
                            </Label>
                            <Input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleAvatarUpload}
                                disabled={uploading}
                            />
                        </div>
                        {uploading && <span className="text-xs text-muted-foreground animate-pulse">Качване...</span>}
                        <p className="text-xs text-muted-foreground text-center max-w-[150px]">
                            Кликнете върху снимката, за да я промените
                        </p>
                    </div>

                    <div className="flex-1 w-full space-y-6 max-w-2xl">
                        <div className="grid gap-6 md:grid-cols-2">
                             <div className="space-y-2">
                                <Label>Потребителско име</Label>
                                <div className="relative">
                                    <Input value={user.email?.split('@')[0]} disabled className="bg-muted pl-9" placeholder="Username" />
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                                <p className="text-[0.8rem] text-muted-foreground">Генерирано автоматично от вашия имейл.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Email адрес</Label>
                                <Input value={user.email} disabled className="bg-muted" />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label>Пълно име</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Вашето име"
                                    className="max-w-md"
                                />
                            </div>
                        </div>

                        <div className="flex justify-start pt-4">
                            <Button onClick={handleSave} disabled={isSubmitting} className="min-w-[120px]">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Запазване...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Запази промените
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card >
    );
}
