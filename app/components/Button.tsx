import type { ReactNode } from "react";

// 1. The props. Each line is one thing the caller can tell the Button.
type ButtonProps = {
  children: ReactNode; // what shows inside, like "Scan"
  variant?: "primary" | "outline"; // which look
  size?: "large" | "small"; // which size
  type?: "button" | "submit"; // what kind of button it is
  onClick?: () => void; // what happens on click
  disabled?: boolean; // true means it cannot be clicked
};

// 2. The presets. The looks live here, inside the Button.
const variantClasses = {
  primary: "bg-footer text-on-dark focus-visible:outline-white",
  outline:
    "rounded border border-gray-300 hover:bg-gray-50 focus-visible:outline-blue-600",
};

const sizeClasses = {
  large: "px-5 py-4 text-base md:px-10 md:py-6 md:text-xl",
  small: "px-2 py-0.5 text-xs",
};

// 3. The component. The values after = are the defaults.
const Button = ({
  children,
  variant = "primary",
  size = "small",
  type = "button",
  onClick,
  disabled = false,
}: ButtonProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-4 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      {children}
    </button>
  );
};

export default Button;
