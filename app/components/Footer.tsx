import StarField from "./StarField";

const Footer = () => {
  return (
    <footer className="relative bg-footer px-8 py-24 overflow-hidden">
      <StarField />
      <div className="relative z-10 flex flex-col items-center gap-3 text-center text-on-dark">
        <span className="font-semibold text-xl">
          <i>radar</i>
        </span>
        <span>Your website should work for everyone.</span>
        <span>© 2026 Radar</span>
      </div>
    </footer>
  );
};

export default Footer;
