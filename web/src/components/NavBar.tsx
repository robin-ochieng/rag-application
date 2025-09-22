"use client";
import Link from "next/link";
import ThemeSwitcher from "./ThemeSwitcher";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-[rgb(var(--border))] bg-[rgb(var(--background))]/80 supports-[backdrop-filter]:bg-[rgb(var(--background))]/60 backdrop-blur text-[rgb(var(--foreground))]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/chat" className="font-semibold tracking-tight text-lg md:text-xl" title="Kenbright GPT">
            Kenbright GPT
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-4">
          <ThemeSwitcher />
        </nav>
        <div className="md:hidden">
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
