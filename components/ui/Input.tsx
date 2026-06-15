import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export default function Input({ label, error, hint, className = "", id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-coffee-light">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          "w-full px-3 py-2.5 rounded-xl border text-sm bg-warm-white text-coffee",
          "placeholder:text-coffee/40 outline-none transition-all duration-150",
          error
            ? "border-terracotta focus:ring-2 focus:ring-terracotta/20"
            : "border-border focus:border-gold focus:ring-2 focus:ring-gold/20",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {error && <p className="text-xs text-terracotta">{error}</p>}
      {hint && !error && <p className="text-xs text-coffee/50">{hint}</p>}
    </div>
  );
}
