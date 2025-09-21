export default function Footer() {
  return (
    <footer className="mt-auto bg-[rgb(var(--background))]/80 supports-[backdrop-filter]:bg-[rgb(var(--background))]/60 backdrop-blur border-t border-[rgb(var(--border))]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between text-sm text-[rgb(var(--muted-foreground))]">
        <p>
          Developed by {" "}
          <a className="underline hover:text-[rgb(var(--foreground))]" href="https://kenbright.ai" target="_blank" rel="noreferrer">
            kenbright.ai
          </a>
        </p>
        <nav className="flex gap-4">
          <a href="#" className="hover:text-[rgb(var(--foreground))]">Privacy</a>
          <a href="#" className="hover:text-[rgb(var(--foreground))]">Terms</a>
        </nav>
      </div>
    </footer>
  );
}
