import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg" | "none";
};

const paddings = { none: "", sm: "p-4", md: "p-5", lg: "p-6 md:p-8" };

export default function Card({ children, className = "", hover = false, padding = "md" }: CardProps) {
  return (
    <div
      className={[
        "bg-surface-raised border border-border rounded-xl shadow-sm",
        hover ? "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer" : "",
        paddings[padding],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
