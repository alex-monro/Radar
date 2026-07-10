import StarField from "./StarField";

const Footer = () => {
  return (
    <footer className="relative bg-footer px-8 py-24 overflow-hidden">
      <StarField />
      <div className="relative z-10 flex flex-col items-center gap-3 text-center text-on-dark">
        <span className="font-semibold text-xl">radar</span>
        <span>part of the Gravity family</span>
        <span>© 2026 Radar</span>
      </div>
    </footer>
  );
};

export default Footer;
