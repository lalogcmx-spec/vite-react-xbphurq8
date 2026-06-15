import Link from "next/link";
import Button from "@/components/ui/Button";
import Navbar from "@/components/layout/Navbar";
import { ORDERS } from "@/lib/mock-data";
import StatusBadge from "@/components/ui/StatusBadge";

export default async function PedidoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ name?: string }>;
}) {
  const { id } = await params;
  const { name } = await searchParams;

  const order = ORDERS.find((o) => o.id === id);
  const customerName = name ?? order?.customer.name ?? "Cliente";

  return (
    <div className="min-h-screen flex flex-col bg-warm-white">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md flex flex-col items-center text-center gap-6">
          {/* Confirmación */}
          <div className="w-20 h-20 rounded-full bg-olive/15 flex items-center justify-center text-4xl">
            ✅
          </div>
          <div>
            <h1 className="text-3xl font-bold text-coffee">¡Pedido recibido!</h1>
            <p className="text-coffee/60 mt-2">Gracias, <strong>{customerName}</strong>. Tu pedido está en camino.</p>
          </div>

          {/* ID del pedido */}
          <div className="bg-surface border border-border rounded-2xl px-8 py-4 text-center">
            <p className="text-xs text-coffee/50 uppercase tracking-widest mb-1">Número de pedido</p>
            <p className="text-3xl font-bold text-coffee">{id}</p>
          </div>

          {/* Estado */}
          {order && (
            <div className="w-full bg-warm-white border border-border rounded-2xl p-5 text-left flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-coffee">Estado actual</span>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex flex-col gap-1.5">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span>{item.product.imageEmoji}</span>
                    <span className="text-coffee/80">{item.quantity}x {item.product.name}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3 flex justify-between text-sm font-semibold text-coffee">
                <span>Total</span>
                <span>${order.total}</span>
              </div>
            </div>
          )}

          {!order && (
            <div className="w-full bg-surface rounded-2xl p-5 text-center">
              <p className="text-coffee/60 text-sm">Tu pedido fue recibido correctamente. Te avisaremos cuando esté listo.</p>
            </div>
          )}

          <div className="flex flex-col gap-3 w-full">
            <Link href="/menu">
              <Button variant="gold" size="lg" fullWidth>Hacer otro pedido</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="md" fullWidth>Volver al inicio</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
