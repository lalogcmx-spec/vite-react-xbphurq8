import type { OrderStatus } from "@/lib/types";

const config: Record<OrderStatus, { label: string; className: string; dot: string }> = {
  nuevo:      { label: "Nuevo",      className: "bg-gold/15 text-coffee border-gold/30",           dot: "bg-gold" },
  aceptado:   { label: "Aceptado",   className: "bg-olive/15 text-olive border-olive/30",           dot: "bg-olive animate-pulse" },
  preparando: { label: "Preparando", className: "bg-terracotta/15 text-terracotta border-terracotta/30", dot: "bg-terracotta animate-pulse" },
  listo:      { label: "Listo",      className: "bg-olive/25 text-olive border-olive/40",           dot: "bg-olive" },
  entregado:  { label: "Entregado",  className: "bg-coffee/10 text-coffee/60 border-coffee/20",     dot: "bg-coffee/40" },
  cancelado:  { label: "Cancelado",  className: "bg-terracotta/10 text-terracotta/70 border-terracotta/20", dot: "bg-terracotta/50" },
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, className, dot } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
