"use client";

import type { Product } from "@/lib/types";
import { useCart } from "@/contexts/CartContext";
import { Plus, Minus } from "lucide-react";

type ProductCardProps = {
  product: Product;
  size?: "default" | "large";
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function ProductCard({ product, size = "default" }: ProductCardProps) {
  const { items, addItem, setQuantity } = useCart();
  const cartItem = items.find((i) => i.product.id === product.id);
  const qty = cartItem?.quantity ?? 0;

  if (size === "large") {
    return (
      <div className="bg-surface-raised border border-border rounded-xl overflow-hidden flex flex-col hover:shadow-md hover:border-border-strong transition-all duration-150">
        {/* Image placeholder */}
        <div className="h-28 bg-surface flex items-center justify-center relative">
          <span
            style={{ fontFamily: "var(--font-display)" }}
            className="text-3xl font-semibold text-ink-3 select-none"
          >
            {initials(product.name)}
          </span>
          {qty > 0 && (
            <span className="absolute top-2 right-2 bg-ink text-canvas text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm tabular-nums">
              {qty}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5 flex flex-col flex-1 gap-2">
          <div>
            <h3 className="font-semibold text-ink text-sm leading-tight">{product.name}</h3>
            <p className="text-xs text-ink-3 mt-0.5 line-clamp-2 leading-relaxed">{product.description}</p>
          </div>
          <div className="mt-auto pt-1 flex items-center justify-between gap-2">
            <div>
              <span className="text-sm font-bold text-ink">${product.price}</span>
              <span className="text-[10px] text-ink-4 ml-1">{product.unit}</span>
            </div>
            <QtyControl qty={qty} onAdd={() => addItem(product)} onMinus={() => setQuantity(product.id, qty - 1)} />
          </div>
        </div>
      </div>
    );
  }

  // Compact variant (mostrador)
  return (
    <div className="bg-surface-raised border border-border rounded-lg p-3 flex items-center gap-3 hover:shadow-sm hover:border-border-strong transition-all duration-150">
      <div className="w-10 h-10 bg-surface rounded-md flex items-center justify-center shrink-0">
        <span
          style={{ fontFamily: "var(--font-display)" }}
          className="text-sm font-semibold text-ink-3 select-none"
        >
          {initials(product.name)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-ink truncate">{product.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-sm font-bold text-ink">${product.price}</span>
          <span className="text-[10px] text-ink-4">{product.unit}</span>
        </div>
      </div>
      <QtyControl qty={qty} onAdd={() => addItem(product)} onMinus={() => setQuantity(product.id, qty - 1)} />
    </div>
  );
}

function QtyControl({ qty, onAdd, onMinus }: { qty: number; onAdd: () => void; onMinus: () => void }) {
  if (qty === 0) {
    return (
      <button
        onClick={onAdd}
        className="w-8 h-8 rounded-md bg-ink text-canvas flex items-center justify-center hover:bg-ink-2 active:scale-95 transition-all cursor-pointer shadow-sm"
        aria-label="Agregar"
      >
        <Plus size={16} strokeWidth={2.5} />
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onMinus}
        className="w-7 h-7 rounded-md border border-border text-ink flex items-center justify-center hover:bg-surface active:scale-95 transition-all cursor-pointer"
        aria-label="Quitar uno"
      >
        <Minus size={14} strokeWidth={2.5} />
      </button>
      <span className="w-6 text-center text-sm font-bold text-ink tabular-nums">{qty}</span>
      <button
        onClick={onAdd}
        className="w-7 h-7 rounded-md bg-ink text-canvas flex items-center justify-center hover:bg-ink-2 active:scale-95 transition-all cursor-pointer"
        aria-label="Agregar uno"
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
