"use server";

import { createClient } from "@supabase/supabase-js";

export async function loginAction(password: string) {
  const correctPassword = process.env.PANEL_PASSWORD || "admin123";
  if (password === correctPassword) {
    return { success: true };
  }
  return { success: false, error: "رمز عبور اشتباه است." };
}

export async function fetchSubmissionsAction(className: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    return { error: "Vercel environment variables are missing (Supabase URL or Key)." };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('class_name', className)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }
  
  return { data };
}
