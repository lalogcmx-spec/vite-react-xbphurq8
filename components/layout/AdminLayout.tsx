import Link from "next/link";
import type { ReactNode } from "react";

const NAV_SECTIONS = [
  {
    label: "Operación",
    items: [
      { href: "/admin",           label: "Dashboard",    emoji: "📊" },
      { href: "/admin/pedidos",   label: "Pedidos",      emoji: "📋" },
      { href: "/admin/cocina",    label: "Cocina",       emoji: "👨‍🍳" },
      { href: "/admin/productos", label: "Productos",    emoji: "🍽️" },
    ],
  },
  {
    label: "Clientes",
    items: [
      { href: "/admin/clientes",    label: "Clientes",    emoji: "👥" },
      { href: "/admin/empleados",   label: "Empleados",   emoji: "👤" },
      { href: "/admin/recompensas", label: "Recompensas", emoji: "⭐" },
    ],
  },
  {
    label: "Inventario",
    items: [
      { href: "/admin/inventario", label: "Inventario",  emoji: "📦" },
      { href: "/admin/compras",    label: "Compras",     emoji: "🛒" },
      { href: "/admin/recetas",    label: "Recetas",     emoji: "📝" },
      { href: "/admin/costos",     label: "Costos",      emoji: "💹" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/admin/reportes",      label: "Reportes",     emoji: "📈" },
      { href: "/admin/configuracion", label: "Configuración", emoji: "⚙️" },
    ],
  },
];

export default function AdminLayout({
  children,
  currentPath = "",
}: {
  children: ReactNode;
  currentPath?: string;
}) {
  return (
    <div className="flex min-h-screen bg-cream">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-coffee text-cream flex flex-col">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl">🍝</span>
            <div className="leading-tight">
              <div className="font-bold text-sm leading-none">Rossy Gourmet</div>
              <div className="text-[9px] text-gold font-medium tracking-wider uppercase leading-none mt-0.5">
                Admin
              </div>
            </div>
          </Link>
        </div>

        {/* Nav por secciones */}
        <nav className="flex-1 px-2 py-3 flex flex-col gap-3 overflow-y-auto">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-3 text-[9px] font-bold uppercase tracking-widest text-cream/30 mb-1">
                {section.label}
              </p>
              {section.items.map((item) => {
                const active =
                  currentPath === item.href ||
                  (item.href !== "/admin" && currentPath.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-gold/20 text-gold"
                        : "text-cream/65 hover:bg-white/10 hover:text-cream",
                    ].join(" ")}
                  >
                    <span className="text-sm leading-none">{item.emoji}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}

          {/* Separador modo surtidor */}
          <div className="mt-auto pt-3 border-t border-white/10">
            <p className="px-3 text-[9px] font-bold uppercase tracking-widest text-cream/30 mb-1">
              Acceso rápido
            </p>
            <Link
              href="/surtidor"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-terracotta-light hover:bg-terracotta/20 hover:text-cream transition-all"
            >
              <span className="text-sm leading-none">🚚</span>
              Modo Surtidor
            </Link>
            <Link
              href="/mostrador"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-cream/65 hover:bg-white/10 hover:text-cream transition-all"
            >
              <span className="text-sm leading-none">🖥️</span>
              Mostrador TPV
            </Link>
          </div>
        </nav>

        <div className="px-4 py-3 border-t border-white/10 text-[10px] text-cream/30">
          Rossy Gourmet v1.0
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
