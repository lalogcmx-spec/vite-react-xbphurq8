import type { Order, OrderStatus } from "@/lib/types";
import StatusBadge from "@/components/ui/StatusBadge";
import Card from "@/components/ui/Card";

type OrderCardProps = {
  order: Order;
  onStatusChange?: (orderId: string, status: OrderStatus) => void;
  showActions?: boolean;
};

const STATUS_FLOW: Record<OrderStatus, OrderStatus | null> = {
  nuevo: "aceptado",
  aceptado: "preparando",
  preparando: "listo",
  listo: "entregado",
  entregado: null,
  cancelado: null,
};

const STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  aceptado: "Aceptar",
  preparando: "Preparando",
  listo: "Marcar listo",
  entregado: "Entregar",
};

export default function OrderCard({ order, onStatusChange, showActions = false }: OrderCardProps) {
  const nextStatus = STATUS_FLOW[order.status];

  return (
    <Card className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-coffee text-sm">{order.id}</span>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-coffee/50 mt-0.5">
            {new Date(order.createdAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
            {" · "}{order.source}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-coffee">${order.total}</p>
          <p className="text-xs text-coffee/50 capitalize">{order.paymentMethod}</p>
        </div>
      </div>

      {/* Cliente */}
      <div className="text-sm">
        <span className="font-medium text-coffee">{order.customer.name}</span>
        <span className="text-coffee/50 ml-2">·</span>
        <span className="text-coffee/60 ml-2">{order.deliveryType === "pickup" ? "🏠 Recoger" : `🛵 Domicilio ${order.deliveryAddress?.ciudad}`}</span>
      </div>

      {/* Items */}
      <ul className="flex flex-col gap-0.5">
        {order.items.map((item, i) => (
          <li key={i} className="text-xs text-coffee/70">
            {item.quantity}x {item.product.name}
            {item.notes && <span className="text-coffee/40 ml-1">({item.notes})</span>}
          </li>
        ))}
      </ul>

      {/* Acción */}
      {showActions && nextStatus && onStatusChange && (
        <button
          onClick={() => onStatusChange(order.id, nextStatus)}
          className="mt-1 w-full py-2 rounded-xl bg-coffee text-cream text-sm font-semibold hover:bg-coffee-light active:scale-95 transition-all cursor-pointer"
        >
          {STATUS_LABELS[nextStatus] ?? nextStatus}
        </button>
      )}
      {showActions && order.status === "nuevo" && onStatusChange && (
        <button
          onClick={() => onStatusChange(order.id, "cancelado")}
          className="w-full py-1.5 rounded-xl border border-terracotta/40 text-terracotta text-xs font-medium hover:bg-terracotta/5 active:scale-95 transition-all cursor-pointer"
        >
          Cancelar
        </button>
      )}
    </Card>
  );
}
