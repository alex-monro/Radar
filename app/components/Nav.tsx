import Link from "next/link";
import Github from "./Github";

const Nav = () => {
  return (
    <nav className="sticky top-0 px-8 py-6 border-b border-gray-200 flex items-center justify-between bg-(--color-bg) z-10000000">
      <div className="flex items-center gap-3">
        <Link href="/" className="font-semibold text-2xl">
          radar
        </Link>
        <span className="text-muted select-none">|</span>
        <span className="text-muted">a gravity tool</span>
      </div>
      <div className="flex items-center gap-4">
        <Github />
      </div>
    </nav>
  );
};

export default Nav;
