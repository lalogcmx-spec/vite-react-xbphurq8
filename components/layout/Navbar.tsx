"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";

type NavbarProps = {
  cartCount?: number;
  showCart?: boolean;
};

const NAV_LINKS = [
  { href: "/menu", label: "Menú" },
  { href: "/mostrador", label: "Mostrador" },
  { href: "/admin", label: "Admin" },
];

export default function Navbar({ cartCount = 0, showCart = false }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-canvas/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span
            style={{ fontFamily: "var(--font-display)" }}
            className="text-2xl font-semibold text-ink tracking-tight leading-none"
          >
            Rossy Gourmet
          </span>
        </Link>

        {/* Nav links — desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-surface text-ink"
                    : "text-ink-3 hover:text-ink hover:bg-surface"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Cart */}
        <div className="flex items-center">
          {showCart && (
            <Link
              href="/checkout"
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-ink-3 hover:text-ink hover:bg-surface transition-colors"
            >
              <ShoppingBag size={18} strokeWidth={1.75} />
              {cartCount > 0 && (
                <span className="bg-ink text-canvas text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 tabular-nums">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
