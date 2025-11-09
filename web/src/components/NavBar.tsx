"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeSwitcher from "./ThemeSwitcher";
import { useAuth } from "@/contexts/AuthContext";

export default function NavBar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[rgb(var(--border))] bg-[rgb(var(--background))]/80 supports-[backdrop-filter]:bg-[rgb(var(--background))]/60 backdrop-blur text-[rgb(var(--foreground))]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/chat" className="font-semibold tracking-tight text-lg md:text-xl" title="Kenbright GPT">
            Kenbright GPT
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-4">
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-[rgb(var(--muted-foreground))]">
                Welcome, {user.user_metadata?.name || user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-sm text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
          <ThemeSwitcher />
        </nav>
        <div className="md:hidden flex items-center gap-2">
          {user && (
            <button
              onClick={handleSignOut}
              className="text-sm text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors"
            >
              Sign out
            </button>
          )}
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
}
