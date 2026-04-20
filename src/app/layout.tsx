import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Payment Testing App",
  description: "A payment testing workspace for Paystack and Pesapal flows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <footer className="border-t border-white/5 py-8 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Payment Testing Workspace. Developed for sandbox validation.</p>
        </footer>
      </body>
    </html>
  );
}
