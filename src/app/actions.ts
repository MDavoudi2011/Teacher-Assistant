"use server";

export async function loginAction(password: string) {
  const correctPassword = process.env.PANEL_PASSWORD || "admin123";
  if (password === correctPassword) {
    return { success: true };
  }
  return { success: false, error: "رمز عبور اشتباه است." };
}
