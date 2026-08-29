import Link from "next/link";

const variants = {
  primary: "bg-brand text-white shadow-sm hover:bg-brand-dark",
  secondary:
    "border border-border bg-surface text-foreground hover:bg-black/5 dark:hover:bg-white/5",
  danger: "bg-danger text-white shadow-sm hover:bg-danger/90",
  ghost: "text-foreground hover:bg-black/5 dark:hover:bg-white/5",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

type Common = {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
  children: React.ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  children,
  href,
}: Common & { href: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </Link>
  );
}
