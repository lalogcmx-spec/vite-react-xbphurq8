"use client";

import { useState } from "react";
import { CartProvider, useCart } from "@/contexts/CartContext";
import { CATEGORIES, PRODUCTS, getCustomerByPhone, EMPLOYEES } from "@/lib/mock-data";
import type { PaymentMethod, Customer } from "@/lib/types";
import { Search, X, Plus, Minus, MessageCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { waOrderReceived } from "@/lib/whatsapp";

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "efectivo",      label: "Efectivo" },
  { id: "transferencia", label: "Transferencia" },
  { id: "terminal",      label: "Terminal" },
  { id: "mercadopago",   label: "Mercado Pago" },
  { id: "pendiente",     label: "Pendiente" },
];

const ACTIVE_EMPLOYEE = EMPLOYEES[0];

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function MostradorContent() {
  const { items, addItem, setQuantity, removeItem, total, count, clear } = useCart();
  const [activeCat, setActiveCat]           = useState(CATEGORIES[0].id);
  const [search, setSearch]                 = useState("");
  const [phone, setPhone]                   = useState("");
  const [customer, setCustomer]             = useState<Customer | null>(null);
  const [phoneNotFound, setPhoneNotFound]   = useState(false);
  const [paymentMethod, setPaymentMethod]   = useState<PaymentMethod>("efectivo");
  const [ticketVisible, setTicketVisible]   = useState(false);
  const [orderId]                           = useState(() => "ORD-" + Date.now().toString().slice(-4));

  const catProducts = PRODUCTS.filter(
    (p) =>
      p.categoryId === activeCat &&
      p.available &&
      (search === "" || p.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handlePhoneSearch = () => {
    const found = getCustomerByPhone(phone);
    if (found) { setCustomer(found); setPhoneNotFound(false); }
    else        { setCustomer(null); setPhoneNotFound(true); }
  };

  const handleCobrar = () => { if (items.length > 0) setTicketVisible(true); };

  const handleNuevoPedido = () => {
    clear();
    setTicketVisible(false);
    setCustomer(null);
    setPhone("");
    setPhoneNotFound(false);
    setPaymentMethod("efectivo");
  };

  /* ── Ticket ─────────────────────────────────────────────────── */
  if (ticketVisible) {
    const waLink = customer
      ? waOrderReceived({
          id: orderId,
          createdAt: new Date().toISOString(),
          customer,
          items,
          deliveryType: "pickup",
          status: "nuevo",
          paymentMethod,
          paymentStatus: paymentMethod === "pendiente" ? "pendiente" : "pagado",
          subtotal: total,
          total,
          source: "mostrador",
          employeeId: ACTIVE_EMPLOYEE.id,
        })
      : null;

    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="bg-surface-raised border border-border rounded-2xl shadow-lg p-8 w-full max-w-sm flex flex-col items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-green-subtle flex items-center justify-center">
            <span className="text-green font-bold text-lg">✓</span>
          </div>
          <div className="text-center">
            <h2
              style={{ fontFamily: "var(--font-display)" }}
              className="text-3xl font-semibold text-ink"
            >
              Venta registrada
            </h2>
            <p className="text-ink-4 text-xs mt-1">#{orderId}</p>
          </div>

          <div className="w-full border border-dashed border-border rounded-lg p-4 flex flex-col gap-2">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-ink-3">{item.quantity}× {item.product.name}</span>
                <span className="font-semibold text-ink">${item.product.price * item.quantity}</span>
              </div>
            ))}
            <div className="border-t border-border mt-2 pt-2 flex justify-between font-semibold text-ink">
              <span>Total</span>
              <span
                style={{ fontFamily: "var(--font-display)" }}
                className="text-xl"
              >
                ${total}
              </span>
            </div>
          </div>

          {customer && (
            <p className="text-xs text-ink-3 text-center">
              Cliente: <strong className="text-ink">{customer.name}</strong> · Sellos: {customer.stamps} → {customer.stamps + 1}
            </p>
          )}

          <div className="flex flex-col gap-2 w-full">
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" fullWidth size="lg">
                  <MessageCircle size={16} /> WhatsApp al cliente
                </Button>
              </a>
            )}
            <Button variant="gold" fullWidth size="lg" onClick={handleNuevoPedido}>
              Nuevo pedido
            </Button>
          </div>
          <p className="text-[11px] text-ink-4">Empleado: {ACTIVE_EMPLOYEE.name}</p>
        </div>
      </div>
    );
  }

  /* ── Main layout ─────────────────────────────────────────────── */
  return (
    <div className="h-screen flex flex-col bg-canvas overflow-hidden">
      {/* Topbar */}
      <header className="bg-ink text-canvas px-5 py-2.5 flex items-center justify-between shrink-0 h-12">
        <span
          style={{ fontFamily: "var(--font-display)" }}
          className="text-xl font-semibold tracking-tight"
        >
          Rossy Gourmet
          <span className="text-gold-light text-sm font-normal ml-2">Mostrador</span>
        </span>
        <div className="flex items-center gap-2 text-xs text-canvas/60">
          <span>{ACTIVE_EMPLOYEE.name}</span>
          <Badge variant="gold">{ACTIVE_EMPLOYEE.role}</Badge>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT: Products (60%) ── */}
        <div className="flex-[3] flex flex-col overflow-hidden border-r border-border">
          {/* Search */}
          <div className="px-3 pt-3 pb-2 border-b border-border shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-canvas text-sm text-ink placeholder:text-ink-4 outline-none focus:border-border-strong"
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-border shrink-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={[
                  "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer shrink-0",
                  activeCat === cat.id
                    ? "bg-ink text-canvas"
                    : "text-ink-3 hover:text-ink hover:bg-surface",
                ].join(" ")}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {catProducts.map((p) => {
                const inCart = items.find((i) => i.product.id === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => addItem(p)}
                    className={[
                      "bg-surface-raised border rounded-lg p-3 text-left hover:shadow-sm active:scale-95 transition-all cursor-pointer relative",
                      inCart ? "border-gold bg-gold-subtle" : "border-border hover:border-border-strong",
                    ].join(" ")}
                  >
                    {inCart && (
                      <span className="absolute top-2 right-2 bg-ink text-canvas text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center tabular-nums">
                        {inCart.quantity}
                      </span>
                    )}
                    <div
                      className="w-8 h-8 rounded-md bg-surface flex items-center justify-center mb-2"
                    >
                      <span
                        style={{ fontFamily: "var(--font-display)" }}
                        className="text-xs font-semibold text-ink-3 select-none"
                      >
                        {initials(p.name)}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-ink leading-tight line-clamp-2 mb-1">{p.name}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-bold text-ink">${p.price}</span>
                      <span className="text-[9px] text-ink-4">{p.unit}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {catProducts.length === 0 && (
              <div className="text-center py-12 text-ink-4 text-sm">Sin productos en esta categoría</div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Cart + Checkout (40%) ── */}
        <div className="flex-[2] flex flex-col bg-surface-raised overflow-hidden shrink-0 max-w-xs xl:max-w-sm">
          {/* Customer search */}
          <div className="px-3 pt-3 pb-2.5 border-b border-border shrink-0">
            <p className="text-[11px] font-medium text-ink-3 mb-1.5">Cliente por teléfono</p>
            <div className="flex gap-1.5">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePhoneSearch()}
                placeholder="55 1234 5678"
                className="flex-1 px-2.5 py-2 rounded-lg border border-border text-xs text-ink outline-none focus:border-border-strong bg-canvas"
              />
              <button
                onClick={handlePhoneSearch}
                className="px-2.5 py-2 bg-ink text-canvas rounded-lg text-xs font-medium hover:bg-ink-2 cursor-pointer transition-colors"
              >
                Buscar
              </button>
            </div>
            {customer && (
              <div className="mt-2 bg-green-subtle border border-green/20 rounded-lg p-2">
                <p className="text-xs font-semibold text-green">{customer.name}</p>
                <p className="text-[10px] text-green/70">{customer.stamps} sellos · {customer.totalOrders} pedidos</p>
              </div>
            )}
            {phoneNotFound && (
              <p className="text-[10px] text-red mt-1.5">No encontrado — se registrará como nuevo.</p>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1.5">
            {items.length === 0 && (
              <div className="text-center py-10 text-ink-4 text-xs">
                Toca un producto para agregar
              </div>
            )}
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-2 bg-surface rounded-lg px-2 py-2">
                <div className="w-6 h-6 rounded bg-surface-raised border border-border flex items-center justify-center shrink-0">
                  <span style={{ fontFamily: "var(--font-display)" }} className="text-[9px] font-semibold text-ink-3">
                    {initials(item.product.name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-ink truncate">{item.product.name}</p>
                  <p className="text-[10px] text-ink-4">${item.product.price} c/u</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setQuantity(item.product.id, item.quantity - 1)}
                    className="w-5 h-5 rounded border border-border text-ink flex items-center justify-center cursor-pointer hover:bg-surface"
                  >
                    <Minus size={10} />
                  </button>
                  <span className="w-4 text-center text-xs font-bold text-ink tabular-nums">{item.quantity}</span>
                  <button
                    onClick={() => addItem(item.product)}
                    className="w-5 h-5 rounded bg-ink text-canvas flex items-center justify-center cursor-pointer hover:bg-ink-2"
                  >
                    <Plus size={10} />
                  </button>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="w-5 h-5 rounded text-red/60 flex items-center justify-center cursor-pointer hover:bg-red-subtle ml-0.5"
                  >
                    <X size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Total + payment + action */}
          <div className="border-t border-border px-3 py-3 flex flex-col gap-3 shrink-0">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-ink-3">{count} {count === 1 ? "producto" : "productos"}</span>
              <span
                style={{ fontFamily: "var(--font-display)" }}
                className="text-3xl font-semibold text-ink"
              >
                ${total}
              </span>
            </div>

            {/* Payment method chips */}
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_METHODS.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id)}
                  className={[
                    "px-3 py-1.5 rounded-md border text-[11px] font-medium transition-all cursor-pointer",
                    paymentMethod === pm.id
                      ? "border-ink bg-ink text-canvas"
                      : "border-border text-ink-3 hover:border-border-strong hover:text-ink",
                  ].join(" ")}
                >
                  {pm.label}
                </button>
              ))}
            </div>

            <Button variant="gold" fullWidth size="lg" onClick={handleCobrar} disabled={items.length === 0}>
              Cobrar ${total}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MostradorPage() {
  return (
    <CartProvider>
      <MostradorContent />
    </CartProvider>
  );
}
