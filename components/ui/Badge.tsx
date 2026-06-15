import type { ReactNode } from "react";

type BadgeVariant = "gold" | "coffee" | "olive" | "terracotta" | "neutral";

type BadgeProps = { variant?: BadgeVariant; children: ReactNode; className?: string };

const variants: Record<BadgeVariant, string> = {
  gold: "bg-gold/15 text-coffee border border-gold/30",
  coffee: "bg-coffee/10 text-coffee border border-coffee/20",
  olive: "bg-olive/15 text-olive border border-olive/30",
  terracotta: "bg-terracotta/15 text-terracotta border border-terracotta/30",
  neutral: "bg-surface text-coffee/70 border border-border",
};

export default function Badge({ variant = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full",
        variants[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
