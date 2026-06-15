import Link from "next/link";
import { UtensilsCrossed, Monitor, Tablet, BarChart3, ChefHat, Star, MapPin, MessageCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

const FEATURES = [
  {
    Icon: UtensilsCrossed,
    title: "Pedidos Online",
    desc: "Tus clientes ordenan desde cualquier dispositivo, 24/7. Sin app extra.",
    href: "/menu",
    cta: "Ver menú",
  },
  {
    Icon: Monitor,
    title: "Mostrador TPV",
    desc: "Toma pedidos rápidamente desde el mostrador, asociado al empleado activo.",
    href: "/mostrador",
    cta: "Abrir TPV",
  },
  {
    Icon: Tablet,
    title: "Kiosko",
    desc: "El cliente elige su pedido solo. Ideal para eventos y autoservicio.",
    href: "/kiosko",
    cta: "Abrir kiosko",
  },
  {
    Icon: Star,
    title: "Recompensas",
    desc: "Cada compra suma un sello. 5 sellos = postre gratis. Fideliza clientes.",
    href: "/admin/recompensas",
    cta: "Ver recompensas",
  },
  {
    Icon: ChefHat,
    title: "Cocina en vivo",
    desc: "Pantalla de cocina con estados en tiempo real: nuevo, preparando, listo.",
    href: "/admin/cocina",
    cta: "Ver cocina",
  },
  {
    Icon: BarChart3,
    title: "Panel Admin",
    desc: "Controla ventas, productos, empleados, clientes y reportes.",
    href: "/admin",
    cta: "Ir al admin",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="bg-ink text-canvas">
        <div className="max-w-5xl mx-auto px-6 py-28 flex flex-col items-center text-center gap-6">
          <p className="text-gold text-xs font-medium tracking-[0.2em] uppercase">Cocina que enamora</p>
          <h1
            style={{ fontFamily: "var(--font-display)" }}
            className="text-6xl md:text-7xl font-semibold tracking-tight leading-[1.1]"
          >
            Rossy Gourmet
          </h1>
          <p className="text-canvas/60 text-base max-w-md leading-relaxed">
            Lasañas artesanales, pastas y postres preparados con amor.
            Pide en línea o visítanos. Domicilio en Coacalco y Tultitlán.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            <Link href="/menu">
              <Button variant="gold" size="lg">Ver menú</Button>
            </Link>
            <Link href="/mostrador">
              <Button
                variant="secondary"
                size="lg"
                className="!bg-white/10 !text-canvas !border-white/15 hover:!bg-white/20"
              >
                Mostrador
              </Button>
            </Link>
            <Link href="/admin">
              <Button
                variant="secondary"
                size="lg"
                className="!bg-white/10 !text-canvas !border-white/15 hover:!bg-white/20"
              >
                Admin
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap gap-5 justify-center text-sm text-canvas/40 mt-1">
            <span className="flex items-center gap-1.5"><MapPin size={13} /> Coacalco &amp; Tultitlán</span>
            <span className="flex items-center gap-1.5"><MessageCircle size={13} /> WhatsApp directo</span>
            <span className="flex items-center gap-1.5"><Star size={13} /> Programa de sellos</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto w-full px-6 py-16">
        <div className="text-center mb-10">
          <h2
            style={{ fontFamily: "var(--font-display)" }}
            className="text-4xl font-semibold text-ink tracking-tight"
          >
            Todo en un solo sistema
          </h2>
          <p className="text-ink-3 mt-2 text-sm">Diseñado para operar tu negocio completo.</p>
          <div className="mt-4 w-8 h-px bg-gold mx-auto" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ Icon, title, desc, href, cta }) => (
            <Card key={title} hover padding="lg" className="flex flex-col gap-4">
              <div className="w-9 h-9 rounded-md bg-surface flex items-center justify-center">
                <Icon size={18} strokeWidth={1.5} className="text-ink-2" />
              </div>
              <div>
                <h3 className="font-semibold text-ink text-sm">{title}</h3>
                <p className="text-ink-3 text-xs mt-1 leading-relaxed">{desc}</p>
              </div>
              <Link href={href} className="mt-auto">
                <span className="text-xs font-medium text-gold hover:text-gold-light transition-colors">
                  {cta} →
                </span>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA domicilio */}
      <section className="bg-surface border-y border-border py-14">
        <div className="max-w-2xl mx-auto px-6 text-center flex flex-col items-center gap-5">
          <MapPin size={24} strokeWidth={1.5} className="text-gold" />
          <h2
            style={{ fontFamily: "var(--font-display)" }}
            className="text-3xl font-semibold text-ink"
          >
            Domicilio disponible
          </h2>
          <p className="text-ink-3 text-sm max-w-sm">
            Hacemos entregas en <strong className="text-ink">Coacalco</strong> y{" "}
            <strong className="text-ink">Tultitlán</strong>. También puedes recoger en
            tienda sin costo de envío.
          </p>
          <Link href="/menu">
            <Button variant="primary" size="lg">Pedir ahora</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-ink text-canvas/50 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span
              style={{ fontFamily: "var(--font-display)" }}
              className="font-semibold text-canvas text-base"
            >
              Rossy Gourmet
            </span>
            <span className="text-gold">— Cocina que enamora</span>
          </div>
          <div className="flex gap-6">
            <Link href="/menu" className="hover:text-canvas transition-colors">Menú</Link>
            <Link href="/admin" className="hover:text-canvas transition-colors">Admin</Link>
            <Link href="/mostrador" className="hover:text-canvas transition-colors">Mostrador</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
