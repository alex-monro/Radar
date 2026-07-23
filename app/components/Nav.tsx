import Link from "next/link";
import Github from "./Github";

const Nav = () => {
  return (
    <nav className="sticky top-0 z-50 px-8 py-6 border-b border-gray-200 flex items-center justify-between bg-(--color-bg)">
      <div className="flex items-center gap-3">
        <Link href="/" className="font-semibold text-2xl">
          radar
        </Link>
        <span className="text-muted select-none">|</span>
        <span className="text-muted">a gravity tool</span>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/about"
          className="text-muted transition-colors hover:text-(--color-fg)"
        >
          about
        </Link>
        <Github />
      </div>
    </nav>
  );
};

export default Nav;
