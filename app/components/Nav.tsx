import Link from "next/link";
import Github from "./Github";

const Nav = () => {
  return (
    <nav className="sticky top-0 z-50 px-4 py-6 md:px-8 border-b border-gray-200 flex items-center justify-between gap-3 bg-(--color-bg)">
      <div className="flex items-center gap-3">
        <Link href="/" className="font-semibold text-2xl">
          radar
        </Link>
        {/* The tagline is hidden on phones so it doesn't crowd the GitHub
            button; the wordmark alone carries the brand at that width. */}
        <span className="text-muted select-none hidden sm:inline">|</span>
        <span className="text-muted hidden sm:inline">a gravity tool</span>
      </div>
      <div className="flex items-center gap-4">
        <Github />
      </div>
    </nav>
  );
};

export default Nav;
