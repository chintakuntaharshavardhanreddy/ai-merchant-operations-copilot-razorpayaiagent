import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "AI Merchant Operations Copilot | Payment & Ops Intelligence",
  description: "AI-powered intelligence for modern payment operations. Understand payment performance, investigate failed transactions, and take controlled operational actions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${inter.variable} min-h-full flex flex-col bg-[#090A0F] text-zinc-100 font-sans selection:bg-blue-600/30 selection:text-blue-200`}>
        {children}
      </body>
    </html>
  );
}
