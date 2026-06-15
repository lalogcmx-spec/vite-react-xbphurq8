"use client";

import { useState } from "react";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { CATEGORIES, PRODUCTS, getCustomerByPhone } from "@/lib/mock-data";
import type { Customer } from "@/lib/types";
import { Plus, Minus, ArrowLeft, MapPin, Star } from "lucide-react";
import Button from "@/components/ui/Button";

type Step = "welcome" | "menu" | "cart" | "phone" | "confirm";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function KioskoContent() {
  const { items, addItem, setQuantity, total, count, clear } = useCart();
  const [step, setStep]           = useState<Step>("welcome");
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id);
  const [phone, setPhone]         = useState("");
  const [customer, setCustomer]   = useState<Customer | null>(null);
  const [orderId]                 = useState(() => "K-" + Date.now().toString().slice(-4));

  const catProducts = PRODUCTS.filter((p) => p.categoryId === activeCat && p.available);

  const handlePhoneSearch = () => {
    const found = getCustomerByPhone(phone);
    setCustomer(found ?? null);
    setStep("confirm");
  };

  /* ── Welcome ─────────────────────────────────────────────────── */
  if (step === "welcome") {
    return (
      <div className="min-h-screen bg-ink flex flex-col items-center justify-center gap-12 px-8 text-center">
        <div className="flex flex-col items-center gap-5">
          <p className="text-gold text-sm font-medium tracking-[0.2em] uppercase">Bienvenido</p>
          <h1
            style={{ fontFamily: "var(--font-display)" }}
            className="text-7xl font-semibold text-canvas tracking-tight"
          >
            Rossy Gourmet
          </h1>
          <p className="text-canvas/50 text-lg max-w-sm">
            Toca para ver nuestro menú y realizar tu pedido
          </p>
        </div>
        <button
          onClick={() => setStep("menu")}
          className="bg-gold text-canvas px-14 py-6 rounded-2xl text-2xl font-semibold hover:bg-gold-light active:scale-95 transition-all shadow-lg cursor-pointer"
        >
          Ordenar ahora
        </button>
        <p className="text-canvas/30 text-sm flex items-center gap-1.5">
          <MapPin size={13} /> Domicilio solo en Coacalco y Tultitlán
        </p>
      </div>
    );
  }

  /* ── Menu ────────────────────────────────────────────────────── */
  if (step === "menu") {
    return (
      <div className="min-h-screen bg-canvas flex flex-col">
        <header className="bg-ink text-canvas px-6 py-4 flex items-center justify-between shrink-0">
          <span
            style={{ fontFamily: "var(--font-display)" }}
            className="text-2xl font-semibold tracking-tight"
          >
            Rossy Gourmet
          </span>
          {count > 0 && (
            <button
              onClick={() => setStep("cart")}
              className="flex items-center gap-2 bg-gold text-canvas px-6 py-3 rounded-xl font-semibold text-sm cursor-pointer hover:bg-gold-light active:scale-95 transition-all"
            >
              Ver pedido
              <span className="bg-ink text-canvas w-6 h-6 rounded-full text-xs flex items-center justify-center tabular-nums">
                {count}
              </span>
            </button>
          )}
        </header>

        {/* Category chips */}
        <div className="flex gap-3 px-5 py-4 overflow-x-auto border-b border-border shrink-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={[
                "px-6 py-3 rounded-xl font-medium whitespace-nowrap text-sm transition-all cursor-pointer shrink-0 border",
                activeCat === cat.id
                  ? "bg-ink text-canvas border-ink"
                  : "bg-surface-raised text-ink border-border hover:border-border-strong",
              ].join(" ")}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {catProducts.map((p) => {
              const inCart = items.find((i) => i.product.id === p.id);
              return (
                <div
                  key={p.id}
                  className="bg-surface-raised border border-border rounded-xl overflow-hidden flex flex-col"
                >
                  <div className="h-36 bg-surface flex items-center justify-center">
                    <span
                      style={{ fontFamily: "var(--font-display)" }}
                      className="text-4xl font-semibold text-ink-3 select-none"
                    >
                      {initials(p.name)}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col flex-1 gap-3">
                    <div>
                      <h3 className="font-semibold text-ink text-base leading-tight">{p.name}</h3>
                      <p className="text-ink-3 text-xs mt-1 leading-relaxed line-clamp-2">{p.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        <span className="text-xl font-bold text-ink">${p.price}</span>
                        <span className="text-xs text-ink-4 ml-1">{p.unit}</span>
                      </div>
                      {inCart ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setQuantity(p.id, inCart.quantity - 1)}
                            className="w-10 h-10 rounded-lg border-2 border-border text-ink flex items-center justify-center cursor-pointer hover:bg-surface active:scale-95"
                          >
                            <Minus size={18} />
                          </button>
                          <span className="w-7 text-center font-bold text-ink text-lg tabular-nums">{inCart.quantity}</span>
                          <button
                            onClick={() => addItem(p)}
                            className="w-10 h-10 rounded-lg bg-ink text-canvas flex items-center justify-center cursor-pointer hover:bg-ink-2 active:scale-95"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addItem(p)}
                          className="bg-ink text-canvas px-5 py-2.5 rounded-lg font-semibold text-sm cursor-pointer hover:bg-ink-2 active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <Plus size={15} /> Agregar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {count > 0 && (
          <div className="sticky bottom-0 px-5 py-4 bg-canvas border-t border-border">
            <button
              onClick={() => setStep("cart")}
              className="w-full bg-gold text-canvas py-4 rounded-xl font-semibold text-lg flex items-center justify-between px-6 cursor-pointer hover:bg-gold-light active:scale-95 transition-all"
            >
              <span>Ver pedido ({count} {count === 1 ? "item" : "items"})</span>
              <span style={{ fontFamily: "var(--font-display)" }} className="text-2xl">${total}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Cart ────────────────────────────────────────────────────── */
  if (step === "cart") {
    return (
      <div className="min-h-screen bg-canvas flex flex-col">
        <header className="bg-ink text-canvas px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setStep("menu")}
            className="text-canvas/60 hover:text-canvas cursor-pointer transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <h1
            style={{ fontFamily: "var(--font-display)" }}
            className="text-2xl font-semibold"
          >
            Tu pedido
          </h1>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.product.id}
              className="bg-surface-raised border border-border rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center shrink-0">
                <span style={{ fontFamily: "var(--font-display)" }} className="text-sm font-semibold text-ink-3">
                  {initials(item.product.name)}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-ink">{item.product.name}</p>
                <p className="text-ink-3 text-sm">${item.product.price} c/u</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(item.product.id, item.quantity - 1)}
                  className="w-11 h-11 rounded-lg border-2 border-border text-ink flex items-center justify-center cursor-pointer hover:bg-surface active:scale-95"
                >
                  <Minus size={18} />
                </button>
                <span className="text-lg font-bold text-ink w-6 text-center tabular-nums">{item.quantity}</span>
                <button
                  onClick={() => addItem(item.product)}
                  className="w-11 h-11 rounded-lg bg-ink text-canvas flex items-center justify-center cursor-pointer hover:bg-ink-2 active:scale-95"
                >
                  <Plus size={18} />
                </button>
              </div>
              <span className="font-bold text-ink w-16 text-right">${item.product.price * item.quantity}</span>
            </div>
          ))}
        </div>
        <div className="px-5 py-5 border-t border-border bg-surface-raised">
          <div className="flex justify-between items-baseline mb-5">
            <span className="text-ink-3">Total</span>
            <span style={{ fontFamily: "var(--font-display)" }} className="text-4xl font-semibold text-ink">
              ${total}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { clear(); setStep("welcome"); }}
              className="flex-1 py-4 border border-border text-ink-3 rounded-xl font-medium cursor-pointer hover:bg-surface active:scale-95 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={() => setStep("phone")}
              className="flex-[2] py-4 bg-gold text-canvas rounded-xl font-semibold text-lg cursor-pointer hover:bg-gold-light active:scale-95 transition-all"
            >
              Continuar
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Phone ───────────────────────────────────────────────────── */
  if (step === "phone") {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-8 gap-8">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-gold-subtle flex items-center justify-center mx-auto mb-4">
            <Star size={22} strokeWidth={1.5} className="text-gold" />
          </div>
          <h2
            style={{ fontFamily: "var(--font-display)" }}
            className="text-4xl font-semibold text-ink"
          >
            Recompensas
          </h2>
          <p className="text-ink-3 mt-2 max-w-sm">
            Ingresa tu teléfono para sumar sellos. 5 sellos = postre gratis.
          </p>
        </div>
        <div className="w-full max-w-sm flex flex-col gap-4">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="55 1234 5678"
            className="w-full px-6 py-5 rounded-xl border-2 border-border text-ink text-2xl text-center outline-none focus:border-border-strong bg-surface-raised"
          />
          <Button variant="gold" size="xl" fullWidth onClick={handlePhoneSearch}>
            Buscar mi cuenta
          </Button>
          <button
            onClick={() => { setCustomer(null); setStep("confirm"); }}
            className="text-ink-3 text-sm cursor-pointer hover:text-ink transition-colors py-2"
          >
            Continuar sin recompensas →
          </button>
        </div>
      </div>
    );
  }

  /* ── Confirm ─────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-8 gap-8 text-center">
      <div className="w-16 h-16 rounded-full bg-green-subtle flex items-center justify-center">
        <span className="text-green font-bold text-2xl">✓</span>
      </div>
      <div>
        <h2
          style={{ fontFamily: "var(--font-display)" }}
          className="text-5xl font-semibold text-ink"
        >
          Pedido registrado
        </h2>
        <div className="mt-5 border border-border rounded-xl px-12 py-5 inline-block bg-surface-raised">
          <p className="text-xs text-ink-4 uppercase tracking-widest mb-1">Número de pedido</p>
          <p
            style={{ fontFamily: "var(--font-display)" }}
            className="text-6xl font-semibold text-ink"
          >
            {orderId}
          </p>
        </div>
        <p className="text-ink-3 mt-5 text-lg">Pasa a caja para realizar tu pago.</p>
        {customer && (
          <p className="text-green text-sm mt-2">
            Hola {customer.name}, tienes {customer.stamps} sello(s).
          </p>
        )}
      </div>
      <div className="bg-gold-subtle border border-gold/30 rounded-xl px-6 py-4 max-w-sm flex items-center gap-2">
        <MapPin size={14} className="text-gold shrink-0" />
        <p className="text-ink-3 text-sm">
          Domicilio solo en <strong className="text-ink">Coacalco</strong> y <strong className="text-ink">Tultitlán</strong>
        </p>
      </div>
      <button
        onClick={() => { clear(); setStep("welcome"); }}
        className="bg-ink text-canvas px-12 py-5 rounded-2xl font-semibold text-lg cursor-pointer hover:bg-ink-2 active:scale-95 transition-all"
      >
        Nuevo pedido
      </button>
    </div>
  );
}

export default function KioskoPage() {
  return (
    <CartProvider>
      <KioskoContent />
    </CartProvider>
  );
}
