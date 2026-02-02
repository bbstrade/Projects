"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import { getDictionary } from "@/lib/dictionary";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useConvexAuth } from "convex/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

// Define validation schema
const registerSchema = z.object({
    name: z.string().min(2, { message: "Името трябва да е поне 2 символа" }),
    email: z.string().email({ message: "Моля въведете валиден имейл" }),
    password: z.string().min(6, { message: "Паролата трябва да е поне 6 символа" }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const { signIn } = useAuthActions();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(false);
    const [otp, setOtp] = useState("");
    const [formData, setFormData] = useState<RegisterFormValues | null>(null);

    const router = useRouter();
    const { lang } = useLanguage();
    const dict = getDictionary(lang);
    const { theme, setTheme } = useTheme();
    const { isAuthenticated } = useConvexAuth();

    // Initialize form
    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

    useEffect(() => {
        if (isAuthenticated) {
            router.push("/dashboard");
        }
    }, [isAuthenticated, router]);

    const onSubmit = async (values: RegisterFormValues) => {
        setLoading(true);
        setError("");

        try {
            // First step: Trigger verification code
            await signIn("password", { email: values.email, password: values.password, name: values.name, flow: "signUp" });
            setFormData(values);
            setPendingVerification(true);
            toast.success(dict.verificationSent || "Изпратен е код за потвърждение!");
        } catch (err) {
            console.error(err);
            handleAuthError(err);
            setLoading(false);
        }
    };

    const onVerify = async () => {
        if (!formData || !otp) return;
        setLoading(true);
        setError("");

        try {
            // Second step: Verify code
            await signIn("password", {
                email: formData.email,
                password: formData.password,
                name: formData.name,
                flow: "signUp",
                code: otp
            });
            toast.success(dict.registerSuccess || "Успешна регистрация!");
            // Remove manual router.push here to avoid race condition with Middleware cookie check
            // The useEffect above will handle redirection once isAuthenticated is true
        } catch (err) {
            console.error(err);
            handleAuthError(err);
            setLoading(false);
        }
    };

    const handleAuthError = (err: any) => {
        let errorMessage = "Възникна грешка.";
        const errString = String(err);
        if (errString.includes("already exists")) {
            errorMessage = "Потребител с този имейл вече съществува.";
        } else if (errString.includes("Weak password")) {
            errorMessage = "Паролата е твърде слаба.";
        } else if (errString.includes("Network")) {
            errorMessage = "Проблем с мрежата.";
        } else if (errString.includes("Code")) {
            errorMessage = "Грешен код за потвърждение.";
        }
        setError(errorMessage);
    };

    if (pendingVerification) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-[100px] pointer-events-none" />

                <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
                    <CardHeader className="text-center pt-8">
                        <div className="flex justify-center mb-4">
                            <div className="relative w-24 h-24">
                                <Image src="/logo.png" alt="Logo" fill style={{ objectFit: "contain" }} />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                            {dict.verificationSent || "Код за потвърждение"}
                        </CardTitle>
                        <CardDescription className="text-lg mt-2">
                            {dict.checkEmail || "Въведете кода изпратен на"}: <span className="font-medium text-primary">{formData?.email}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center pb-8 space-y-6">
                        {error && (
                            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Грешка</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="otp" className="sr-only">Code</Label>
                            <Input
                                id="otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="123456"
                                className="text-center text-2xl tracking-[0.5em] font-mono h-14 border-2 focus:ring-2 focus:ring-primary/20"
                                maxLength={6}
                                autoFocus
                            />
                        </div>

                        <Button
                            onClick={onVerify}
                            className="w-full h-11 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98] bg-black hover:bg-black/90 text-white"
                            disabled={loading || otp.length < 6}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Verifying...</span>
                                </div>
                            ) : (
                                "Потвърди"
                            )}
                        </Button>

                        <Button
                            variant="ghost"
                            className="w-full text-muted-foreground hover:text-primary"
                            onClick={() => setPendingVerification(false)}
                        >
                            Назад
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 relative overflow-hidden">

            {/* Background decoration */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200/30 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-[100px] pointer-events-none" />

            <div className="absolute top-4 right-4 z-10">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-sm"
                >
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </div>

            <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl animate-in fade-in zoom-in duration-500">
                <CardHeader className="space-y-1 text-center pb-8 pt-8">
                    <div className="flex justify-center mb-4 transition-transform hover:scale-105 duration-300">
                        <div className="relative w-24 h-24 filter drop-shadow-lg">
                            <Image
                                src="/logo.png"
                                alt="Logo"
                                fill
                                style={{ objectFit: "contain" }}
                                priority
                            />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                        {dict.register || "Регистрация"}
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                        {dict.createAccount || "Създайте нов акаунт"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-8 pb-8">
                    {error && (
                        <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Грешка</AlertTitle>
                            <AlertDescription>
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium">{dict.name || "Име"}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Иван Петров"
                                                className={`h-11 transition-all duration-200 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 ${error ? 'border-red-500 focus:ring-red-200' : ''}`}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium">{dict.email || "Имейл"}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="name@example.com"
                                                type="email"
                                                className={`h-11 transition-all duration-200 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 ${error ? 'border-red-500 focus:ring-red-200' : ''}`}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-sm font-medium">{dict.password || "Парола"}</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="••••••••"
                                                type="password"
                                                className={`h-11 transition-all duration-200 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 ${error ? 'border-red-500 focus:ring-red-200' : ''}`}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                className="w-full h-11 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200 active:scale-[0.98] bg-black hover:bg-black/90 text-white mt-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Creating...</span>
                                    </div>
                                ) : (
                                    dict.register || "Регистрация"
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <Separator className="bg-gray-100 dark:bg-gray-800" />
                <CardFooter className="flex flex-col space-y-4 pt-6 pb-8 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="text-center text-sm text-muted-foreground">
                        {dict.alreadyHaveAccount || "Вече имате акаунт?"}{" "}
                        <Link href="/login" className="font-semibold text-primary hover:text-primary/80 hover:underline transition-all">
                            {dict.login || "Вход"}
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
