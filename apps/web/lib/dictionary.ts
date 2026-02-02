// import "server-only";  <-- Removed to support Client Component usage


const dictionaries = {
    en: () => Promise.resolve({
        login: "Log in",
        loginPrompt: "Enter your credentials to access your account",
        email: "Email",
        password: "Password",
        register: "Register",
        registerSuccess: "Registration successful!",
        loginSuccess: "Login successful!",
        invalidCredentials: "Invalid credentials.",
        noAccount: "Don't have an account?",
        alreadyHaveAccount: "Already have an account?",
        name: "Name",
        createAccount: "Create your account",
        verificationSent: "Verification email sent",
        checkEmail: "Please check your email"
    }),
    bg: () => Promise.resolve({
        login: "Вход",
        loginPrompt: "Въведете вашите данни за вход",
        email: "Имейл",
        password: "Парола",
        register: "Регистрация",
        registerSuccess: "Успешна регистрация!",
        loginSuccess: "Успешен вход!",
        invalidCredentials: "Грешен имейл или парола.",
        noAccount: "Нямате акаунт?",
        alreadyHaveAccount: "Вече имате акаунт?",
        name: "Име",
        createAccount: "Създайте своя профил",
        verificationSent: "Код за потвърждение",
        checkEmail: "Моля проверете имейла си"
    }),
};

export const getDictionary = async (locale: string) => {
    if (locale === "bg") {
        return dictionaries.bg();
    }
    return dictionaries.en();
};
