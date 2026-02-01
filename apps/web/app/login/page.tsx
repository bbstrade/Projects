"use client";

import { useState, useEffect } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    orContinueWith: "Или продължете с",
    googleLogin: "Google",
    loginError: "Грешен имейл или парола",
    loginSuccess: "Успешен вход!",
};

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { signIn, signOut } = useAuthActions();
    const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();

    // Query backend session state directly
    const backendUser = useQuery(api.myUser.get);

    useEffect(() => {
        setMounted(true);
    }, []);

    const logoSrc = mounted && resolvedTheme === "dark" ? "/logo-dark.png" : "/logo.png";
    const themeDebug = mounted ? resolvedTheme : "system";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await signIn("password", { email, password, flow: "signIn" });
            toast.success(dict.loginSuccess);
            router.push("/dashboard");
        } catch (error) {
            console.error("Login error:", error);
            let errorMessage = dict.loginError;
            if (error instanceof Error) {
                if (error.message.includes("Invalid login credentials")) {
                    errorMessage = "Грешен имейл или парола."; // Standardize generic backend error
                } else if (error.message.includes("Account not found")) {
                    errorMessage = "Акаунтът не е намерен.";
                } else {
                    errorMessage = "Грешка: " + error.message;
                }
            }
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await signIn("google", { redirectTo: "/dashboard" });
        } catch (error) {
            console.error("Google login error:", error);
            toast.error("Грешка при вход с Google");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 relative" suppressHydrationWarning>
            <div className="absolute top-0 left-0 p-2 text-xs text-black bg-yellow-200 z-50 opacity-80 select-text">
                DEBUG INFO:<br />
                CONVEX_URL: {process.env.NEXT_PUBLIC_CONVEX_URL || "UNDEFINED"}<br />
                IS_AUTH: {isAuthenticated ? "TRUE" : "FALSE"}<br />
                AUTH_LOADING: {isAuthLoading ? "YES" : "NO"}<br />
                BACKEND_USER: {backendUser === undefined ? "LOADING..." : backendUser === null ? "NULL" : backendUser}<br />
                THEME: {themeDebug}
            </div>

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
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-9"
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
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-9 pr-10"
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

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <Separator className="w-full" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                                {dict.orContinueWith}
                            </span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                    >
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        {dict.googleLogin}
                    </Button>
                </CardContent>
                <CardFooter className="justify-center flex-col">
                    <p className="text-sm text-muted-foreground">
                        {dict.noAccount}{" "}
                        <Link href="/register" className="text-blue-600 hover:underline font-medium">
                            {dict.register}
                        </Link>
                    </p>
                    <button
                        onClick={() => void signOut()}
                        className="text-xs text-muted-foreground mt-4 hover:underline hover:text-red-500 transition-colors"
                    >
                        Проблем с входа? Изчисти сесията
                    </button>
                </CardFooter>
            </Card>
        </div>
    );
}
