export default function Footer() {
  return (
    <footer className="mt-auto supports-[backdrop-filter]:bg-white/60 dark:bg-neutral-900/50 backdrop-blur border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between text-sm text-neutral-300">
        <p>
          Developed by {" "}
          <a className="underline hover:text-white" href="https://kenbright.ai" target="_blank" rel="noreferrer">
            kenbright.ai
          </a>
        </p>
        <nav className="flex gap-4">
          <a href="#" className="hover:text-white">Privacy</a>
          <a href="#" className="hover:text-white">Terms</a>
        </nav>
      </div>
    </footer>
  );
}
