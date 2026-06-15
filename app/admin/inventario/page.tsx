import { SUPPLIES, getInventoryValue } from "@/lib/mock-inventory";
import SectionTitle from "@/components/ui/SectionTitle";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { InventoryStatus } from "@/lib/types-inventory";

const STATUS_CONFIG: Record<InventoryStatus, { label: string; variant: "olive" | "gold" | "terracotta" }> = {
  suficiente: { label: "Suficiente", variant: "olive" },
  bajo:       { label: "Stock bajo", variant: "gold" },
  agotado:    { label: "Agotado",    variant: "terracotta" },
};

const CATEGORY_ORDER = ["Verduras", "Carnes", "Embutidos", "Lácteos", "Abarrotes", "Empaque"];

export default function InventarioPage() {
  const totalValue = getInventoryValue();
  const low = SUPPLIES.filter((s) => s.status === "bajo" || s.status === "agotado");

  // Agrupar por categoría
  const grouped = CATEGORY_ORDER.reduce<Record<string, typeof SUPPLIES>>((acc, cat) => {
    const items = SUPPLIES.filter((s) => s.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});
  // Categorías no listadas
  SUPPLIES.forEach((s) => {
    if (!CATEGORY_ORDER.includes(s.category)) {
      if (!grouped[s.category]) grouped[s.category] = [];
      if (!grouped[s.category].includes(s)) grouped[s.category].push(s);
    }
  });

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle title="Inventario" subtitle={`${SUPPLIES.length} insumos registrados`} />
        <Card padding="sm" className="border-gold/20">
          <p className="text-xs text-coffee/50">Valor estimado del inventario</p>
          <p className="text-2xl font-bold text-coffee">${totalValue.toFixed(0)}</p>
        </Card>
      </div>

      {/* Alertas */}
      {low.length > 0 && (
        <div className="bg-terracotta/10 border border-terracotta/30 rounded-2xl p-4">
          <p className="font-semibold text-terracotta mb-2">⚠️ {low.length} insumo{low.length > 1 ? "s" : ""} requieren atención</p>
          <div className="flex flex-wrap gap-2">
            {low.map((s) => (
              <span key={s.id} className="bg-warm-white border border-terracotta/30 text-terracotta text-xs font-medium px-2.5 py-1 rounded-full">
                {s.name} — {s.status === "agotado" ? "AGOTADO" : `${s.currentStock} ${s.baseUnit}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabla por categoría */}
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <h3 className="font-semibold text-coffee mb-3 text-sm uppercase tracking-wide">{cat}</h3>
          <Card padding="none" className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr>
                  {["Insumo", "Stock", "Unidad", "Costo/u", "Stock mín.", "Estado"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-coffee/60">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((s, i) => {
                  const cfg = STATUS_CONFIG[s.status];
                  return (
                    <tr key={s.id} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-cream/30"}`}>
                      <td className="px-4 py-3 font-medium text-coffee">{s.name}</td>
                      <td className="px-4 py-3 font-mono text-coffee">{s.currentStock}</td>
                      <td className="px-4 py-3 text-coffee/60">{s.baseUnit}</td>
                      <td className="px-4 py-3 text-coffee">${s.avgCost}</td>
                      <td className="px-4 py-3 text-coffee/60">{s.minStock} {s.baseUnit}</td>
                      <td className="px-4 py-3">
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      ))}
    </div>
  );
}
