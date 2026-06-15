"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { ArrowLeft, CreditCard, ShoppingBag } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

type DeliveryType = "pickup" | "delivery";
type Ciudad = "Coacalco" | "Tultitlán" | "otra";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function CheckoutPage() {
  const { items, total, count, clear } = useCart();
  const router = useRouter();

  const [name, setName]       = useState("");
  const [phone, setPhone]     = useState("");
  const [email, setEmail]     = useState("");
  const [delivery, setDelivery] = useState<DeliveryType>("pickup");
  const [ciudad, setCiudad]   = useState<Ciudad>("Coacalco");
  const [street, setStreet]   = useState("");
  const [colonia, setColonia] = useState("");
  const [cp, setCp]           = useState("");
  const [refs, setRefs]       = useState("");
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [mpError, setMpError] = useState<string | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "El nombre es requerido";
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10)
      e.phone = "Ingresa un teléfono válido de 10 dígitos";
    if (delivery === "delivery") {
      if (ciudad === "otra") e.ciudad = "Solo hacemos entregas en Coacalco y Tultitlán";
      if (!street.trim()) e.street = "La calle es requerida";
      if (!colonia.trim()) e.colonia = "La colonia es requerida";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePayOnline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setMpError(null);

    const orderId = "ORD-" + Date.now().toString().slice(-4);

    try {
      const res = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          customerEmail: email || undefined,
          items: items.map((i) => ({
            name: i.product.name,
            price: i.product.price,
            qty: i.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.init_point) {
        throw new Error(data.error ?? "Error al iniciar el pago");
      }

      // Limpiar carrito ANTES de redirigir a MP
      clear();
      window.location.href = data.init_point;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setMpError(msg);
      setLoading(false);
    }
  };

  const handleWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const orderId = "ORD-" + Date.now().toString().slice(-4);
    const lines = items
      .map((i) => `• ${i.quantity}x ${i.product.name} — $${i.product.price * i.quantity}`)
      .join("\n");
    const address =
      delivery === "delivery"
        ? `\n📍 Dirección: ${street}, ${colonia}, ${ciudad} ${cp}`
        : "\n🏠 Recoger en tienda";

    const msg = encodeURIComponent(
      `Hola Rossy Gourmet! Quiero hacer un pedido 🍝\n\n${lines}\n\n💰 Total: $${total}\n👤 Nombre: ${name}\n📱 Tel: ${phone}${address}\n\n#${orderId}`
    );

    clear();
    window.open(`https://wa.me/5215512345678?text=${msg}`, "_blank");
    router.push(`/pedido/${orderId}?name=${encodeURIComponent(name)}`);
  };

  /* ── Carrito vacío ───────────────────────────────────────── */
  if (count === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-canvas">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
            <ShoppingBag size={24} strokeWidth={1.5} className="text-ink-3" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-ink">Carrito vacío</h2>
            <p className="text-ink-3 mt-1 text-sm">Agrega productos del menú para continuar.</p>
          </div>
          <Button onClick={() => router.push("/menu")} variant="gold" size="lg">
            Ver menú
          </Button>
        </div>
      </div>
    );
  }

  /* ── Main checkout ───────────────────────────────────────── */
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <Navbar cartCount={count} showCart />

      <div className="max-w-5xl mx-auto w-full px-5 py-6 flex-1">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-ink-3 hover:text-ink transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1
              style={{ fontFamily: "var(--font-display)" }}
              className="text-3xl font-semibold text-ink tracking-tight"
            >
              Finaliza tu pedido
            </h1>
            <p className="text-xs text-ink-3">Ingresa tus datos para confirmar</p>
          </div>
        </div>

        <div className="flex gap-6 flex-col lg:flex-row-reverse">
          {/* Order summary */}
          <aside className="lg:w-72 xl:w-80 shrink-0">
            <div className="sticky top-20">
              <Card padding="lg">
                <h3 className="font-semibold text-ink text-sm mb-1">Tu pedido</h3>
                <p className="text-xs text-ink-4 mb-4">{count} producto{count !== 1 ? "s" : ""}</p>
                <div className="flex flex-col gap-2.5 mb-4 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-md bg-surface flex items-center justify-center shrink-0">
                        <span style={{ fontFamily: "var(--font-display)" }} className="text-xs font-semibold text-ink-3">
                          {initials(item.product.name)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-ink leading-tight truncate">
                          {item.product.name}
                        </p>
                        <p className="text-[11px] text-ink-3">
                          {item.quantity} × ${item.product.price}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-ink shrink-0 tabular-nums">
                        ${item.product.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-3 flex justify-between items-baseline">
                  <span className="text-sm text-ink-3">Total</span>
                  <span
                    style={{ fontFamily: "var(--font-display)" }}
                    className="text-2xl font-semibold text-ink tabular-nums"
                  >
                    ${total}
                  </span>
                </div>
              </Card>
            </div>
          </aside>

          {/* Form */}
          <form className="flex-1 flex flex-col gap-4">
            {/* Personal data */}
            <Card padding="lg">
              <h3 className="font-semibold text-ink text-sm mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-ink text-canvas text-[10px] flex items-center justify-center font-bold">1</span>
                Tus datos
              </h3>
              <div className="flex flex-col gap-4">
                <Input label="Nombre completo" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} placeholder="Ana López" />
                <Input label="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} placeholder="55 1234 5678" type="tel" hint="Tu teléfono es tu ID de cliente y programa de sellos" />
                <Input label="Correo (recomendado para recibo MP)" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ana@email.com" type="email" />
              </div>
            </Card>

            {/* Delivery */}
            <Card padding="lg">
              <h3 className="font-semibold text-ink text-sm mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-ink text-canvas text-[10px] flex items-center justify-center font-bold">2</span>
                Tipo de entrega
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {(["pickup", "delivery"] as DeliveryType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDelivery(type)}
                    className={[
                      "py-3.5 rounded-xl border-2 text-sm font-semibold transition-all cursor-pointer",
                      delivery === type
                        ? "border-ink bg-ink text-canvas"
                        : "border-border text-ink-3 hover:border-border-strong hover:text-ink",
                    ].join(" ")}
                  >
                    {type === "pickup" ? "Recoger en tienda" : "Domicilio"}
                  </button>
                ))}
              </div>

              {delivery === "delivery" && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-ink-3">Ciudad de entrega</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Coacalco", "Tultitlán", "otra"] as Ciudad[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCiudad(c)}
                          className={[
                            "py-2.5 rounded-lg border-2 text-sm font-medium transition-all cursor-pointer",
                            ciudad === c
                              ? c === "otra"
                                ? "border-red bg-red text-white"
                                : "border-ink bg-ink text-canvas"
                              : "border-border text-ink-3 hover:border-border-strong",
                          ].join(" ")}
                        >
                          {c === "otra" ? "Otra" : c}
                        </button>
                      ))}
                    </div>
                    {errors.ciudad && (
                      <div className="bg-red-subtle border border-red/30 rounded-lg p-3 mt-1">
                        <p className="text-red text-sm font-semibold">Zona no disponible</p>
                        <p className="text-red/70 text-xs mt-0.5">Solo hacemos domicilio en Coacalco y Tultitlán.</p>
                      </div>
                    )}
                  </div>
                  {ciudad !== "otra" && (
                    <>
                      <Input label="Calle y número" value={street} onChange={(e) => setStreet(e.target.value)} error={errors.street} placeholder="Av. Principal 123" />
                      <div className="grid grid-cols-2 gap-3">
                        <Input label="Colonia" value={colonia} onChange={(e) => setColonia(e.target.value)} error={errors.colonia} placeholder="Col. Centro" />
                        <Input label="C.P." value={cp} onChange={(e) => setCp(e.target.value)} placeholder="55700" />
                      </div>
                      <Input label="Referencias (opcional)" value={refs} onChange={(e) => setRefs(e.target.value)} placeholder="Entre calles, color de fachada..." />
                    </>
                  )}
                </div>
              )}
            </Card>

            {/* Payment buttons */}
            <Card padding="lg">
              <h3 className="font-semibold text-ink text-sm mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-ink text-canvas text-[10px] flex items-center justify-center font-bold">3</span>
                Método de pago
              </h3>

              {mpError && (
                <div className="bg-red-subtle border border-red/30 rounded-lg p-3 mb-4">
                  <p className="text-red text-sm font-semibold">Error al conectar con Mercado Pago</p>
                  <p className="text-red/70 text-xs mt-0.5">{mpError}</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  onClick={handlePayOnline}
                  disabled={loading}
                  className="w-full flex items-center justify-between px-5 py-4 bg-[#009EE3] hover:bg-[#0088C7] active:scale-95 text-white rounded-xl font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2">
                    <CreditCard size={18} />
                    Pagar con Mercado Pago
                  </span>
                  <span className="text-sm font-bold tabular-nums">${total}</span>
                </button>

                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-ink-4 shrink-0">o</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <button
                  type="submit"
                  onClick={handleWhatsApp}
                  disabled={loading}
                  className="w-full flex items-center justify-between px-5 py-4 bg-[#25D366] hover:bg-[#1DB954] active:scale-95 text-white rounded-xl font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-2">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Pedir por WhatsApp
                  </span>
                  <span className="text-sm opacity-80">Pago en tienda</span>
                </button>
              </div>

              <p className="text-[11px] text-ink-4 mt-4 text-center">
                Mercado Pago acepta tarjetas, transferencia y efectivo en tiendas de conveniencia
              </p>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
}
