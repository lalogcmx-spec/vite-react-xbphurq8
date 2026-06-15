"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ProductCard from "@/components/features/ProductCard";
import CartPanel from "@/components/features/CartPanel";
import { useCart } from "@/contexts/CartContext";
import { CATEGORIES, PRODUCTS } from "@/lib/mock-data";

export default function MenuPage() {
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id);
  const [cartOpen, setCartOpen] = useState(false);
  const { count } = useCart();
  const router = useRouter();

  const filtered = PRODUCTS.filter((p) => p.categoryId === activeCat && p.available);
  const activeCatName = CATEGORIES.find((c) => c.id === activeCat)?.name ?? "";

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Navbar cartCount={count} showCart />

      <div className="max-w-6xl mx-auto w-full px-5 py-6 flex-1 flex flex-col gap-5">
        {/* Heading */}
        <div>
          <h1
            style={{ fontFamily: "var(--font-display)" }}
            className="text-4xl font-semibold text-ink tracking-tight"
          >
            Menú
          </h1>
          <p className="text-xs text-ink-3 mt-1">Productos frescos preparados diariamente</p>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={[
                "px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 shrink-0 cursor-pointer border",
                activeCat === cat.id
                  ? "bg-ink text-canvas border-ink"
                  : "bg-canvas text-ink-3 border-border hover:border-border-strong hover:text-ink",
              ].join(" ")}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Main layout */}
        <div className="flex gap-6 flex-1 min-h-0">
          {/* Products */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-4">
              <h2 className="font-semibold text-ink text-sm">{activeCatName}</h2>
              <span className="text-xs text-ink-4">{filtered.length} productos</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} size="large" />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="py-16 text-center text-ink-4 text-sm">
                No hay productos disponibles en esta categoría.
              </div>
            )}
          </div>

          {/* Cart sidebar — desktop */}
          <aside className="hidden lg:block w-72 xl:w-80 shrink-0">
            <div
              className="sticky top-20 bg-surface-raised border border-border rounded-xl shadow-sm overflow-hidden flex flex-col"
              style={{ maxHeight: "calc(100vh - 5.5rem)" }}
            >
              <CartPanel />
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile sticky bar */}
      {count > 0 && (
        <div className="fixed bottom-0 left-0 right-0 lg:hidden z-40 px-4 pb-4 pt-2 bg-canvas/90 backdrop-blur-sm border-t border-border">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full bg-ink text-canvas rounded-xl py-3.5 flex items-center justify-between px-5 shadow-md cursor-pointer active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="bg-gold text-canvas text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center tabular-nums">
                {count}
              </span>
              <span className="font-medium text-sm">Ver carrito</span>
            </div>
            <ShoppingBag size={18} strokeWidth={1.75} className="text-gold" />
          </button>
        </div>
      )}

      {/* Cart drawer — mobile */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} />
          <div
            className="absolute bottom-0 left-0 right-0 bg-surface-raised rounded-t-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "85vh" }}
          >
            <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-border shrink-0">
              <h2 className="font-semibold text-ink text-sm">Tu pedido</h2>
              <button
                onClick={() => setCartOpen(false)}
                className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-ink-3 hover:text-ink cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>
            <CartPanel onCheckout={() => { setCartOpen(false); router.push("/checkout"); }} />
          </div>
        </div>
      )}
    </div>
  );
}
