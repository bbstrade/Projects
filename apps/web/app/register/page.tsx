"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Mail, Lock, User, UserPlus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

const dict = {
    title: "Създаване на акаунт",
    subtitle: "Регистрирайте се в системата за управление на проекти",
    nameLabel: "Име",
    namePlaceholder: "Вашето име",
    emailLabel: "Имейл",
    emailPlaceholder: "вашият@имейл.bg",
    passwordLabel: "Парола",
    passwordPlaceholder: "Минимум 8 символа",
    confirmPasswordLabel: "Потвърдете паролата",
    confirmPasswordPlaceholder: "Повторете паролата",
    registerButton: "Регистрация",
    loading: "Създаване на акаунт...",
    hasAccount: "Вече имате акаунт?",
    login: "Вход",
    passwordMismatch: "Паролите не съвпадат",
    registerError: "Грешка при регистрация",
    registerSuccess: "Успешна регистрация!",
    errors: {
        emailExists: "Този имейл вече е регистриран.",
        weakPassword: "Паролата е твърде слаба или кратка.",
        invalidEmail: "Невалиден имейл адрес.",
        networkError: "Грешка в мрежата. Моля, опитайте отново.",
        generic: "Възникна грешка. Моля, опитайте отново.",
    },
};

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingVerification, setPendingVerification] = useState(false);
    const { signIn } = useAuthActions();
    const router = useRouter();

    const getErrorMessage = (err: Error): string => {
        const message = err.message.toLowerCase();

        if (message.includes("already exists") || message.includes("duplicate")) {
            return dict.errors.emailExists;
        }
        if (message.includes("password") || message.includes("weak")) {
            return dict.errors.weakPassword;
        }
        if (message.includes("email") || message.includes("invalid")) {
            return dict.errors.invalidEmail;
        }
        if (message.includes("network") || message.includes("fetch")) {
            return dict.errors.networkError;
        }

        return dict.errors.generic;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError(dict.passwordMismatch);
            toast.error(dict.passwordMismatch);
            return;
        }

        setIsLoading(true);

        try {
            await signIn("password", { email, password, name, flow: "signUp" });
            setPendingVerification(true);
            toast.success(dict.registerSuccess);
        } catch (err) {
            console.error("Register error:", err);
            const errorMessage = err instanceof Error ? getErrorMessage(err) : dict.errors.generic;
            setError(errorMessage);
            toast.error(errorMessage);
            setIsLoading(false);
        }
    };

    // Clear error when user starts typing
    const clearError = () => {
        if (error) setError(null);
    };

    if (pendingVerification) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
                <Card className="w-full max-w-md shadow-xl">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="relative h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                                <Mail className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">Проверете имейла си</CardTitle>
                        <CardDescription>
                            Изпратихме линк за потвърждение на <strong>{email}</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground mb-4">
                            Моля, последвайте линка в имейла, за да активирате акаунта си и да влезете в системата.
                        </p>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push("/login")}
                        >
                            Към вход
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="relative h-16 w-16">
                            <Image
                                src="/logo.png"
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
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
                        <div className="space-y-2">
                            <Label htmlFor="name">{dict.nameLabel}</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder={dict.namePlaceholder}
                                    value={name}
                                    onChange={(e) => { setName(e.target.value); clearError(); }}
                                    className="pl-9"
                                    required
                                    suppressHydrationWarning
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">{dict.emailLabel}</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={dict.emailPlaceholder}
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); clearError(); }}
                                    className={`pl-9 ${error ? "border-destructive" : ""}`}
                                    required
                                    suppressHydrationWarning
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{dict.passwordLabel}</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder={dict.passwordPlaceholder}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); clearError(); }}
                                    className={`pl-9 pr-10 ${error ? "border-destructive" : ""}`}
                                    minLength={8}
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
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">{dict.confirmPasswordLabel}</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? "text" : "password"}
                                    placeholder={dict.confirmPasswordPlaceholder}
                                    value={confirmPassword}
                                    onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
                                    className={`pl-9 ${error ? "border-destructive" : ""}`}
                                    minLength={8}
                                    required
                                    suppressHydrationWarning
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
                                <>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    {dict.registerButton}
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        {dict.hasAccount}{" "}
                        <Link href="/login" className="text-blue-600 hover:underline font-medium">
                            {dict.login}
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
