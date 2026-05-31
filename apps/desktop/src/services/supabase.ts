import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uklygrvibmiknwarzqap.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbHlncnZpYm1pa253YXJ6cWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDcyODgsImV4cCI6MjA4NjM4MzI4OH0.aY-R2vzuTzUNbjy1iGmMleikxHOT8MAtL82Rpm5q6ac';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

