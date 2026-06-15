type SectionTitleProps = {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
};

export default function SectionTitle({ title, subtitle, align = "left", className = "" }: SectionTitleProps) {
  return (
    <div className={`flex flex-col gap-1 ${align === "center" ? "text-center items-center" : ""} ${className}`}>
      <h2 className="text-2xl font-bold text-coffee tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-coffee/60">{subtitle}</p>}
      <div className={`mt-1 h-0.5 w-12 rounded-full bg-gold ${align === "center" ? "mx-auto" : ""}`} />
    </div>
  );
}
