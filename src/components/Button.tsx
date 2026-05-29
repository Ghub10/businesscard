import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  children: ReactNode;
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: Props) {
  const base =
    "inline-flex min-h-12 min-w-[44px] items-center justify-center rounded-xl px-4 text-base font-medium transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    primary:
      "bg-primary text-primary-ink focus-visible:outline-primary hover:opacity-95 active:opacity-90",
    secondary:
      "border-line text-ink border-2 bg-surface focus-visible:outline-primary hover:bg-bg",
    ghost: "text-primary focus-visible:outline-primary hover:underline",
  };
  return (
    <button type="button" className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
