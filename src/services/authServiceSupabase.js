import { getSupabase } from './supabase';

const supabase = getSupabase();

export const AuthSupabase = {

    // 1. Sign Up (Email/Password)
    signUp: async (email, password, fullName) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName } // Will trigger profile creation
            }
        });
        return { data, error };
    },

    // 2. Sign In
    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        return { data, error };
    },

    // 3. Google Sign In (Expo)
    signInWithGoogle: async () => {
        // Needs proper deep link setup in App.json (scheme: 'com.agrogb.mobile')
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: 'com.agrogb.mobile://' // or exp:// local URL
            }
        });
        return { data, error };
    },

    // 4. Sign Out
    signOut: async () => {
        return await supabase.auth.signOut();
    },

    // 5. Reset Password (Request Link)
    resetPasswordForEmail: async (email) => {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'com.agrogb.mobile://reset-password'
        });
        return { data, error };
    },

    // 6. Get Financial Summary (RPC)
    getFinancialSummary: async () => {
        const { data, error } = await supabase.rpc('get_my_financial_summary');
        return { data, error };
    }
};
