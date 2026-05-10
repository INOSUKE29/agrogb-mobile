/**
 * Traduz mensagens técnicas do Supabase/Auth para mensagens amigáveis ao usuário final.
 * @param {string} message Mensagem de erro original
 * @returns {string} Mensagem traduzida
 */
export function translateAuthError(message) {
    if (!message) return 'Ocorreu um erro inesperado.';

    const msg = message.toLowerCase();

    if (msg.includes('user already registered') || msg.includes('already exists')) {
        return 'Conta já registrada.';
    }
    
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
        return 'E-mail ou senha inválidos.';
    }

    if (msg.includes('email not confirmed')) {
        return 'Confirme seu e-mail para continuar.';
    }

    if (msg.includes('network request failed')) {
        return 'Falha na conexão. Verifique sua internet.';
    }

    if (msg.includes('rate limit exceeded')) {
        return 'Muitas tentativas. Tente novamente em alguns minutos.';
    }

    return 'Ocorreu um erro ao processar sua solicitação.';
}
