/* 
 * Supabase Configuration
 * Використовує змінні оточення для production або fallback значення для development
 */

// Для Vite використовуємо import.meta.env
// Перевіряємо чи існує import.meta.env перед доступом до властивостей
const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

export const projectId = env.VITE_SUPABASE_PROJECT_ID || "qoqsflrkyxuazgqihnrn";

export const publicAnonKey = env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcXNmbHJreXh1YXpncWlobnJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2NDM4NDksImV4cCI6MjA3NTIxOTg0OX0.9APkITeLiwkzW1w8ruCcvByExB40Mcstb8mj6KsIPK0";

export const supabaseUrl = env.VITE_SUPABASE_URL || `https://${projectId}.supabase.co`;