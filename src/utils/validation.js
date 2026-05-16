
export const validateRegister = (data) => {
    const errors = {};

    if (!data.fullName || data.fullName.length < 3) {
        errors.fullName = "Nome muito curto.";
    }

    const currentYear = new Date().getFullYear();
    if (!data.birthYear || data.birthYear < 1900 || data.birthYear > currentYear) {
        errors.birthYear = "Ano inválido.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
        errors.email = "E-mail inválido.";
    }

    const phoneClean = data.phone?.replace(/\D/g, '') || '';
    if (phoneClean.length < 10) {
        errors.phone = "Telefone incompleto.";
    }

    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!data.password || !passRegex.test(data.password)) {
        errors.password = "Mínimo 8 caracteres, maiúscula, minúscula e número.";
    }

    if (data.password !== data.confirmPassword) {
        errors.confirmPassword = "Senhas não conferem.";
    }

    if (!data.acceptTerms) {
        errors.terms = "Aceite os termos para continuar.";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 8) strength += 0.25;
    if (/[A-Z]/.test(pass)) strength += 0.25;
    if (/[a-z]/.test(pass)) strength += 0.25;
    if (/\d/.test(pass)) strength += 0.25;
    return strength;
};
