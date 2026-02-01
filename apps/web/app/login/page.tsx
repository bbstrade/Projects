"use client";

import { useState, useEffect } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock, LogIn, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useTheme } from "next-themes";

const dict = {
    title: "Добре дошли",
    subtitle: "Влезте в системата за управление на проекти",
    emailLabel: "Имейл",
    emailPlaceholder: "вашият@имейл.bg",
    passwordLabel: "Парола",
    passwordPlaceholder: "Въведете парола",
    loginButton: "Вход",
    loading: "Влизане...",
    noAccount: "Нямате акаунт?",
    register: "Регистрация",
    forgotPassword: "Забравена парола?",
    loginError: "Грешен имейл или парола",
    loginSuccess: "Успешен вход!",
    errors: {
        invalidCredentials: "Грешен имейл или парола.",
        accountNotFound: "Акаунтът не е намерен.",
        networkError: "Грешка в мрежата. Моля, опитайте отново.",
        tooManyAttempts: "Твърде много опити. Моля, изчакайте малко.",
        generic: "Възникна грешка. Моля, опитайте отново.",
    },
};

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { signIn } = useAuthActions();
    const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && !isAuthLoading) {
            router.push("/dashboard");
        }
    }, [isAuthenticated, isAuthLoading, router]);

    const logoSrc = mounted && resolvedTheme === "dark" ? "/logo-dark.png" : "/logo.png";

    const getErrorMessage = (error: Error): string => {
        const message = error.message.toLowerCase();

        if (message.includes("invalid") || message.includes("credentials") || message.includes("password")) {
            return dict.errors.invalidCredentials;
        }
        if (message.includes("not found") || message.includes("no user")) {
            return dict.errors.accountNotFound;
        }
        if (message.includes("network") || message.includes("fetch")) {
            return dict.errors.networkError;
        }
        if (message.includes("rate") || message.includes("limit") || message.includes("too many")) {
            return dict.errors.tooManyAttempts;
        }

        return dict.errors.generic;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await signIn("password", { email, password, flow: "signIn" });
            toast.success(dict.loginSuccess);
            router.push("/dashboard");
        } catch (err) {
            console.error("Login error:", err);
            const errorMessage = err instanceof Error ? getErrorMessage(err) : dict.errors.generic;
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Clear error when user starts typing
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (error) setError(null);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if (error) setError(null);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4" suppressHydrationWarning>
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="relative h-48 w-48 flex items-center justify-center">
                            <Image
                                src={logoSrc}
                                alt="Logo"
                                width={192}
                                height={192}
                                className="object-contain"
                            />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">{dict.title}</CardTitle>
                    <CardDescription>{dict.subtitle}</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
                        <div className="space-y-2">
                            <Label htmlFor="email">{dict.emailLabel}</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={dict.emailPlaceholder}
                                    value={email}
                                    onChange={handleEmailChange}
                                    className={`pl-9 ${error ? "border-destructive" : ""}`}
                                    required
                                    suppressHydrationWarning
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">{dict.passwordLabel}</Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    {dict.forgotPassword}
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder={dict.passwordPlaceholder}
                                    value={password}
                                    onChange={handlePasswordChange}
                                    className={`pl-9 pr-10 ${error ? "border-destructive" : ""}`}
                                    required
                                    suppressHydrationWarning
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
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
                                <>
                                    <LogIn className="mr-2 h-4 w-4" />
                                    {dict.loginButton}
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        {dict.noAccount}{" "}
                        <Link href="/register" className="text-blue-600 hover:underline font-medium">
                            {dict.register}
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
