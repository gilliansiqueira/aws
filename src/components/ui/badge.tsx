const colors: Record<string, string> = {
  gray: "bg-black/5 text-foreground/70",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  yellow: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  purple: "bg-purple-100 text-purple-700",
};

export function Badge({
  children,
  color = "gray",
}: {
  children: React.ReactNode;
  color?: keyof typeof colors;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${colors[color]}`}
    >
      {children}
    </span>
  );
}
