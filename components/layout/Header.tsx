import Link from "next/link";

type HeaderProps = {
  cartCount?: number;
  showCart?: boolean;
};

export default function Header({ cartCount = 0, showCart = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-warm-white/90 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl">🍝</span>
          <div className="leading-tight">
            <div className="font-bold text-coffee text-lg leading-none">Rossy Gourmet</div>
            <div className="text-[10px] text-gold font-medium tracking-wider uppercase leading-none">
              Cocina que enamora
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/menu" className="text-sm font-medium text-coffee/70 hover:text-coffee transition-colors">
            Menú
          </Link>
          <Link href="/admin" className="text-sm font-medium text-coffee/70 hover:text-coffee transition-colors">
            Admin
          </Link>
          <Link href="/mostrador" className="text-sm font-medium text-coffee/70 hover:text-coffee transition-colors">
            Mostrador
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {showCart && (
            <Link href="/checkout" className="relative p-2 text-coffee hover:text-gold transition-colors">
              <span className="text-xl">🛒</span>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-terracotta text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
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
