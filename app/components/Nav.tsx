export default function Nav() {
  return (
    <nav className="sticky top-0 px-8 py-6 border-b border-gray-200 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <a href="/" className="font-semibold text-2xl">radar</a>
        <span className="text-muted select-none">|</span>
        <span className="text-muted">a gravity tool</span>
      </div>
    </nav>
  );
}
