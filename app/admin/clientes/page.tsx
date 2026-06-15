import { CUSTOMERS } from "@/lib/mock-data";
import SectionTitle from "@/components/ui/SectionTitle";
import Card from "@/components/ui/Card";

function StampDots({ stamps }: { stamps: number }) {
  const full = stamps % 5;
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={`w-4 h-4 rounded-full border-2 ${i < full ? "bg-gold border-gold" : "border-border"}`} />
      ))}
    </div>
  );
}

export default function ClientesPage() {
  const sorted = [...CUSTOMERS].sort((a, b) => b.totalOrders - a.totalOrders);
  return (
    <div className="p-6 flex flex-col gap-6">
      <SectionTitle title="Clientes" subtitle={`${CUSTOMERS.length} clientes registrados`} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((c) => (
          <Card key={c.id} padding="md">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-coffee/10 flex items-center justify-center text-lg font-bold text-coffee shrink-0">
                {c.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-coffee truncate">{c.name}</h3>
                  <span className="text-sm font-bold text-coffee shrink-0">${c.totalSpent}</span>
                </div>
                <p className="text-xs text-coffee/50">{c.phone}{c.email ? ` · ${c.email}` : ""}</p>
                <div className="flex items-center justify-between mt-2">
                  <div>
                    <p className="text-[11px] text-coffee/40 mb-1">{c.stamps} sello{c.stamps !== 1 ? "s" : ""} · {c.totalOrders} pedidos</p>
                    <StampDots stamps={c.stamps} />
                  </div>
                  {c.stamps >= 5 && (
                    <span className="text-xs bg-gold/20 text-coffee border border-gold/30 px-2 py-1 rounded-full font-semibold">
                      🎁 Premio listo
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
