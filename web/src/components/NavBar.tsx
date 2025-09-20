"use client";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-40 bg-white/70 dark:bg-neutral-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 dark:supports-[backdrop-filter]:bg-neutral-900/40 border-b border-black/5 dark:border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 shadow-lg shadow-violet-700/30">
            <span className="text-white">🛡️</span>
          </span>
          <Link href="/chat" className="font-semibold tracking-tight text-lg md:text-xl">
            Insurance Act Chatbot
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm text-neutral-700 dark:text-neutral-200/90">
          <Link className="transition-colors hover:text-neutral-900 dark:hover:text-white" href="#">About</Link>
          <Link className="transition-colors hover:text-neutral-900 dark:hover:text-white" href="#">Docs</Link>
          <Link className="transition-colors hover:text-neutral-900 dark:hover:text-white" href="#">Contact</Link>
          <ThemeToggle />
        </nav>
        <div className="md:hidden">
          {/* Minimal mobile menu placeholder */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
