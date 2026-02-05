"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import Image from "next/image";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useTheme } from "next-themes";

const dict = {
    title: "Забравена парола",
    subtitle: "Въведете вашия имейл адрес и ние ще ви изпратим линк за възстановяване на паролата.",
    emailLabel: "Имейл",
    emailPlaceholder: "вашият@имейл.bg",
    submitButton: "Изпрати линк",
    loading: "Изпращане...",
    backToLogin: "Обратно към вход",
    successMessage: "Ако съществува акаунт с този имейл, ще получите инструкции за възстановяване на паролата.",
    errorMessage: "Възникна грешка при изпращането на заявката.",
};

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    const logoSrc = mounted && resolvedTheme === "dark" ? "/logo-dark.png" : "/logo.png";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data, error } = await authClient.forgetPassword({
                email,
                redirectTo: "/reset-password",
            });

            if (error) {
                throw error;
            }

            toast.success(dict.successMessage);
        } catch (error) {
            console.error("Forgot password error:", error);
            toast.error(dict.errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="relative h-16 w-16">
                            <Image
                                src={logoSrc}
                                alt="Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">{dict.title}</CardTitle>
                    <CardDescription>{dict.subtitle}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">{dict.emailLabel}</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={dict.emailPlaceholder}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-9"
                                    required
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {dict.loading}
                                </>
                            ) : (
                                dict.submitButton
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <Link href="/login" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {dict.backToLogin}
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
