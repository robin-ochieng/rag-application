import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import Providers from "./providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kenbright GPT",
  description: "Insurance Act Chatbot — RAG over Insurance Act documents",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "!function(){try{var e=document.documentElement,t=localStorage.getItem('theme');if(t){e.classList.toggle('dark',t==='dark');}else{var m=window.matchMedia('(prefers-color-scheme: dark)').matches;e.classList.toggle('dark',m)}}catch(n){}}();",
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-[rgb(var(--background))] text-[rgb(var(--foreground))]`}>
        <Providers>
          <NavBar />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
