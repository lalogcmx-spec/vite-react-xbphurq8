import Link from "next/link";
import {
  ClipboardList, ChefHat, Package, Users, UserCheck,
  Star, BarChart3, Settings, Monitor, Tablet, TrendingUp,
  ShoppingBag, Clock, ArrowRight,
} from "lucide-react";
import { ORDERS, CUSTOMERS, PRODUCTS } from "@/lib/mock-data";
import Card from "@/components/ui/Card";
import SectionTitle from "@/components/ui/SectionTitle";
import StatusBadge from "@/components/ui/StatusBadge";

const QUICK_LINKS = [
  { href: "/admin/pedidos",       Icon: ClipboardList, label: "Pedidos" },
  { href: "/admin/cocina",        Icon: ChefHat,       label: "Cocina" },
  { href: "/admin/productos",     Icon: Package,       label: "Productos" },
  { href: "/admin/clientes",      Icon: Users,         label: "Clientes" },
  { href: "/admin/empleados",     Icon: UserCheck,     label: "Empleados" },
  { href: "/admin/recompensas",   Icon: Star,          label: "Recompensas" },
  { href: "/admin/reportes",      Icon: BarChart3,     label: "Reportes" },
  { href: "/admin/configuracion", Icon: Settings,      label: "Config" },
];

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function AdminDashboard() {
  const today        = ORDERS;
  const paid         = today.filter((o) => o.paymentStatus === "pagado");
  const pending      = today.filter((o) => ["nuevo", "aceptado", "preparando"].includes(o.status));
  const totalRevenue = paid.reduce((s, o) => s + o.total, 0);
  const frecuentes   = [...CUSTOMERS].sort((a, b) => b.totalOrders - a.totalOrders).slice(0, 3);
  const topProducts  = PRODUCTS.slice(0, 3);

  const KPIS = [
    { label: "Ventas del día",   value: `$${totalRevenue}`, sub: `${paid.length} pedidos pagados`,   Icon: TrendingUp },
    { label: "Pedidos nuevos",   value: String(today.filter((o) => o.status === "nuevo").length), sub: "Sin procesar", Icon: ShoppingBag },
    { label: "En preparación",   value: String(pending.length),  sub: "Pedidos activos",             Icon: Clock },
    { label: "Clientes hoy",     value: String(new Set(today.map((o) => o.customer.id)).size), sub: "Únicos", Icon: Users },
  ];

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <SectionTitle
          title="Dashboard"
          subtitle={`Hoy · ${new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}`}
        />
        <Link href="/" className="text-xs text-ink-3 hover:text-ink flex items-center gap-1 transition-colors">
          ← Ir al sitio
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIS.map(({ label, value, sub, Icon }) => (
          <Card key={label} padding="md">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-ink-3 font-medium">{label}</p>
                <p className="text-2xl font-bold text-ink mt-1 tabular-nums">{value}</p>
                <p className="text-[11px] text-ink-4 mt-0.5">{sub}</p>
              </div>
              <div className="w-8 h-8 rounded-md bg-surface flex items-center justify-center shrink-0">
                <Icon size={15} strokeWidth={1.5} className="text-ink-3" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick links */}
      <Card padding="lg">
        <h3 className="font-semibold text-ink text-sm mb-4">Accesos rápidos</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {QUICK_LINKS.map(({ href, Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-surface hover:bg-surface-raised border border-transparent hover:border-border transition-all text-center group"
            >
              <Icon size={16} strokeWidth={1.5} className="text-ink-3 group-hover:text-ink transition-colors" />
              <span className="text-[11px] font-medium text-ink-3 group-hover:text-ink transition-colors">{label}</span>
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent orders */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink text-sm">Pedidos recientes</h3>
            <Link href="/admin/pedidos" className="text-xs text-gold hover:text-gold-light transition-colors flex items-center gap-0.5">
              Ver todos <ArrowRight size={11} />
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-border">
            {today.slice(0, 4).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-ink">{order.id}</p>
                  <p className="text-xs text-ink-3">{order.customer.name}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <StatusBadge status={order.status} />
                  <span className="text-xs font-semibold text-ink tabular-nums">${order.total}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Frequent customers */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink text-sm">Clientes frecuentes</h3>
            <Link href="/admin/clientes" className="text-xs text-gold hover:text-gold-light transition-colors flex items-center gap-0.5">
              Ver todos <ArrowRight size={11} />
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-border">
            {frecuentes.map((c) => (
              <div key={c.id} className="flex items-center gap-3 py-2.5">
                <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center font-semibold text-ink-3 text-xs shrink-0">
                  {initials(c.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{c.name}</p>
                  <p className="text-xs text-ink-3">{c.totalOrders} pedidos · {c.stamps} sellos</p>
                </div>
                <span className="text-sm font-semibold text-ink tabular-nums">${c.totalSpent}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top products */}
        <Card padding="lg">
          <h3 className="font-semibold text-ink text-sm mb-4">Productos destacados</h3>
          <div className="flex flex-col divide-y divide-border">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 py-2.5">
                <div className="w-8 h-8 rounded-md bg-surface flex items-center justify-center shrink-0">
                  <span style={{ fontFamily: "var(--font-display)" }} className="text-xs font-semibold text-ink-3">
                    {initials(p.name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                  <p className="text-xs text-ink-3">${p.price}</p>
                </div>
                <span className="text-[11px] bg-gold-subtle text-gold px-2 py-0.5 rounded-full font-medium border border-gold/20">
                  #{i + 1}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Operation links */}
        <Card padding="lg">
          <h3 className="font-semibold text-ink text-sm mb-4">Operación</h3>
          <div className="flex flex-col gap-1">
            {[
              { href: "/mostrador",    Icon: Monitor, label: "Abrir Mostrador TPV",  sub: "Toma de pedidos en caja" },
              { href: "/kiosko",       Icon: Tablet,  label: "Abrir Kiosko",         sub: "Autoservicio para clientes" },
              { href: "/admin/cocina", Icon: ChefHat, label: "Pantalla de cocina",   sub: "Estados de pedidos en vivo" },
            ].map(({ href, Icon, label, sub }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface border border-transparent hover:border-border transition-all group"
              >
                <div className="w-8 h-8 rounded-md bg-surface group-hover:bg-surface-raised border border-border flex items-center justify-center shrink-0 transition-colors">
                  <Icon size={14} strokeWidth={1.5} className="text-ink-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">{label}</p>
                  <p className="text-xs text-ink-3">{sub}</p>
                </div>
                <ArrowRight size={14} className="text-ink-4 group-hover:text-ink-3 transition-colors" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
