"use client";

import { useCart } from "@/contexts/CartContext";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";

type CartPanelProps = {
  showCheckout?: boolean;
  onCheckout?: () => void;
};

export default function CartPanel({ showCheckout = true, onCheckout }: CartPanelProps) {
  const { items, setQuantity, removeItem, subtotal, total, count } = useCart();
  const router = useRouter();

  const handleCheckout = () => {
    if (onCheckout) { onCheckout(); return; }
    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 gap-3 text-center px-6">
        <span className="text-5xl">🛒</span>
        <p className="text-coffee/60 text-sm">Tu carrito está vacío.<br />Agrega productos del menú.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-coffee">Tu pedido</h2>
        <span className="text-xs bg-coffee text-cream px-2 py-0.5 rounded-full">{count} items</span>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.product.id} className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">{item.product.imageEmoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-coffee leading-tight">{item.product.name}</p>
              <p className="text-xs text-coffee/50">${item.product.price} c/u</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setQuantity(item.product.id, item.quantity - 1)}
                className="w-6 h-6 rounded border border-border text-coffee flex items-center justify-center text-sm hover:bg-surface cursor-pointer"
              >
                −
              </button>
              <span className="w-5 text-center text-sm font-semibold text-coffee">{item.quantity}</span>
              <button
                onClick={() => setQuantity(item.product.id, item.quantity + 1)}
                className="w-6 h-6 rounded border border-border text-coffee flex items-center justify-center text-sm hover:bg-surface cursor-pointer"
              >
                +
              </button>
              <button
                onClick={() => removeItem(item.product.id)}
                className="w-6 h-6 rounded text-terracotta/60 flex items-center justify-center text-sm hover:bg-terracotta/10 cursor-pointer ml-1"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Totales */}
      <div className="px-4 py-3 border-t border-border space-y-1">
        <div className="flex justify-between text-sm text-coffee/70">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(0)}</span>
        </div>
        <div className="flex justify-between font-bold text-coffee text-base">
          <span>Total</span>
          <span>${total.toFixed(0)}</span>
        </div>
      </div>

      {/* Botón */}
      {showCheckout && (
        <div className="px-4 pb-4 pt-2">
          <Button variant="gold" fullWidth size="lg" onClick={handleCheckout}>
            Continuar al pago →
          </Button>
        </div>
      )}
    </div>
  );
}
