import { ORDERS } from "@/lib/mock-data";
import SectionTitle from "@/components/ui/SectionTitle";
import StatusBadge from "@/components/ui/StatusBadge";
import Card from "@/components/ui/Card";

export default function PedidosPage() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <SectionTitle title="Pedidos" subtitle={`${ORDERS.length} pedidos en total`} />
      <div className="flex flex-col gap-3">
        {ORDERS.map((order) => (
          <Card key={order.id} padding="md">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-coffee">{order.id}</span>
                  <StatusBadge status={order.status} />
                  <span className="text-xs text-coffee/40 capitalize">{order.source}</span>
                </div>
                <p className="text-sm text-coffee/70">
                  {order.customer.name} · {order.customer.phone}
                </p>
                <p className="text-xs text-coffee/50">
                  {order.deliveryType === "pickup" ? "🏠 Recoger" : `🛵 ${order.deliveryAddress?.ciudad}`}
                  {" · "}
                  {new Date(order.createdAt).toLocaleString("es-MX", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                </p>
                <ul className="text-xs text-coffee/60 mt-1">
                  {order.items.map((item, i) => (
                    <li key={i}>{item.quantity}x {item.product.name}</li>
                  ))}
                </ul>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <span className="text-xl font-bold text-coffee">${order.total}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${order.paymentStatus === "pagado" ? "bg-olive/15 text-olive" : "bg-gold/15 text-coffee"}`}>
                  {order.paymentStatus} · {order.paymentMethod}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
