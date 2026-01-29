"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "bg" | "en";

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    // Lazy initialization to strictly respect localStorage on first client render if possible
    // This avoids the 'flicker' or state mismatch if the default was hardcoded to "bg"
    const [lang, setLang] = useState<Language>(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = localStorage.getItem("app-language");
                if (saved === "bg" || saved === "en") {
                    return saved;
                }
            } catch (error) {
                console.error("Failed to read language from localStorage:", error);
            }
        }
        return "bg";
    });

    // Ensure document attribute is synced
    useEffect(() => {
        document.documentElement.lang = lang;
        localStorage.setItem("app-language", lang);
    }, [lang]);

    const handleSetLang = (newLang: Language) => {
        setLang(newLang);
    };

    const t = (key: string) => {
        const translations: Record<Language, Record<string, string>> = {
            bg: {
                filters: "Филтри",
                sortBy: "Сортиране",
                search: "Търсене...",
                clear: "Изчисти",
                projects: "Проекти",
                tasks: "Задачи",
                dashboard: "Табло",
                approvals: "Одобрения",
                teams: "Екипи",
                reports: "Доклади",
                settings: "Настройки",
                profile: "Профил",
                admin: "Админ",
            },
            en: {
                filters: "Filters",
                sortBy: "Sort By",
                search: "Search...",
                clear: "Clear",
                projects: "Projects",
                tasks: "Tasks",
                dashboard: "Dashboard",
                approvals: "Approvals",
                teams: "Teams",
                reports: "Reports",
                settings: "Settings",
                profile: "Profile",
                admin: "Admin",
            }
        };
        return translations[lang][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
