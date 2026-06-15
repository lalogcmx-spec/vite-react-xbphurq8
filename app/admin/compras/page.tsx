import { PURCHASES } from "@/lib/mock-inventory";
import SectionTitle from "@/components/ui/SectionTitle";
import Card from "@/components/ui/Card";
import Link from "next/link";

export default function ComprasPage() {
  const totalSpent = PURCHASES.reduce((s, p) => s + p.totalCost, 0);
  const todaySpent = PURCHASES
    .filter((p) => p.date === "2026-06-12")
    .reduce((s, p) => s + p.totalCost, 0);

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle title="Historial de Compras" subtitle={`${PURCHASES.length} compras registradas`} />
        <Link href="/surtidor">
          <button className="flex items-center gap-2 bg-gold text-coffee px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gold-light cursor-pointer transition-all">
            🚚 Registrar compra
          </button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Total histórico", value: `$${totalSpent.toFixed(0)}`, emoji: "💰" },
          { label: "Gastado hoy", value: `$${todaySpent.toFixed(0)}`, emoji: "📅" },
          { label: "Compras hoy", value: String(PURCHASES.filter(p => p.date === "2026-06-12").length), emoji: "🛒" },
        ].map((k) => (
          <Card key={k.label} padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-coffee/50">{k.label}</p>
                <p className="text-xl font-bold text-coffee mt-0.5">{k.value}</p>
              </div>
              <span className="text-2xl">{k.emoji}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabla */}
      <Card padding="none" className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr>
              {["Fecha", "Proveedor", "Insumo", "Cantidad", "Costo total", "Costo/u", "Variación", "Surtidor"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-coffee/60 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PURCHASES.map((p, i) => {
              const priceUp = p.previousUnitCost !== undefined && p.unitCost > p.previousUnitCost;
              const priceDown = p.previousUnitCost !== undefined && p.unitCost < p.previousUnitCost;
              return (
                <tr key={p.id} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-cream/30"}`}>
                  <td className="px-4 py-3 text-coffee/60 whitespace-nowrap">{p.date}</td>
                  <td className="px-4 py-3 text-coffee">{p.supplierName}</td>
                  <td className="px-4 py-3 font-medium text-coffee">{p.supplyName}</td>
                  <td className="px-4 py-3 text-coffee">{p.quantity} {p.unit}</td>
                  <td className="px-4 py-3 font-bold text-coffee">${p.totalCost}</td>
                  <td className="px-4 py-3 text-coffee">${p.unitCost}</td>
                  <td className="px-4 py-3">
                    {priceUp && (
                      <span className="text-terracotta text-xs font-semibold">
                        ↑ +${(p.unitCost - (p.previousUnitCost ?? 0)).toFixed(2)}
                      </span>
                    )}
                    {priceDown && (
                      <span className="text-olive text-xs font-semibold">
                        ↓ -${((p.previousUnitCost ?? 0) - p.unitCost).toFixed(2)}
                      </span>
                    )}
                    {!priceUp && !priceDown && (
                      <span className="text-coffee/30 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-coffee/60 text-xs">{p.surtidorName}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Notas */}
      {PURCHASES.filter((p) => p.notes).map((p) => (
        <div key={p.id + "-note"} className="bg-gold/10 border border-gold/20 rounded-xl px-4 py-3 flex gap-3">
          <span className="text-gold mt-0.5">💬</span>
          <div>
            <span className="font-medium text-coffee text-sm">{p.supplyName}</span>
            <span className="text-coffee/50 text-xs ml-2">{p.date}</span>
            <p className="text-coffee/70 text-xs mt-0.5">{p.notes}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
