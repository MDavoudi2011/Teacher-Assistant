import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "سامانه دریافت تکالیف",
  description: "پنل مدیریت دریافت فایل های تحقیق دانش آموزان",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        {children}
      </body>
    </html>
  );
}
