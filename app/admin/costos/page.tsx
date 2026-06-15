import { PRODUCT_COSTS } from "@/lib/mock-inventory";
import SectionTitle from "@/components/ui/SectionTitle";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const STATUS_LABELS = {
  rentable:    { label: "Rentable",    variant: "olive"       as const },
  margen_bajo: { label: "Margen bajo", variant: "gold"        as const },
  perdida:     { label: "Pérdida",     variant: "terracotta"  as const },
};

export default function CostosPage() {
  const avg = PRODUCT_COSTS.reduce((s, c) => s + c.margin, 0) / PRODUCT_COSTS.length;
  const best = PRODUCT_COSTS.reduce((a, b) => a.margin > b.margin ? a : b);
  const worst = PRODUCT_COSTS.reduce((a, b) => a.margin < b.margin ? a : b);

  return (
    <div className="p-6 flex flex-col gap-6">
      <SectionTitle title="Análisis de Costos" subtitle="Rentabilidad y márgenes por producto" />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Margen promedio", value: `${avg.toFixed(1)}%`, emoji: "📊" },
          { label: "Mejor margen",    value: best.productName,    emoji: "🏆", sub: `${best.margin.toFixed(1)}%` },
          { label: "Menor margen",    value: worst.productName,   emoji: "⚠️",  sub: `${worst.margin.toFixed(1)}%` },
          { label: "Productos rentables", value: String(PRODUCT_COSTS.filter(c => c.status === "rentable").length), emoji: "✅" },
        ].map((k) => (
          <Card key={k.label} padding="md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-coffee/50">{k.label}</p>
                <p className="text-lg font-bold text-coffee mt-0.5 leading-tight">{k.value}</p>
                {k.sub && <p className="text-xs text-coffee/40">{k.sub}</p>}
              </div>
              <span className="text-xl">{k.emoji}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabla de costos */}
      <Card padding="none" className="overflow-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-surface">
            <tr>
              {[
                "Producto", "Precio venta", "Costo prod.", "Utilidad bruta",
                "Margen %", "Comisión MP", "Utilidad neta",
                "Sug. 40%", "Sug. 50%", "Estado",
              ].map((h) => (
                <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-coffee/60 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRODUCT_COSTS.map((c, i) => {
              const st = STATUS_LABELS[c.status];
              return (
                <tr key={c.productId} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-cream/30"}`}>
                  <td className="px-3 py-3 font-medium text-coffee">{c.productName}</td>
                  <td className="px-3 py-3 font-bold text-coffee">${c.sellingPrice}</td>
                  <td className="px-3 py-3 text-coffee/70">${c.productionCost.toFixed(2)}</td>
                  <td className="px-3 py-3 text-olive font-semibold">${c.grossProfit.toFixed(2)}</td>
                  <td className={`px-3 py-3 font-bold ${c.margin >= 40 ? "text-olive" : "text-terracotta"}`}>
                    {c.margin.toFixed(1)}%
                  </td>
                  <td className="px-3 py-3 text-coffee/60">${c.mpCommission.toFixed(2)}</td>
                  <td className={`px-3 py-3 font-semibold ${c.netProfit > 0 ? "text-coffee" : "text-terracotta"}`}>
                    ${c.netProfit.toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-coffee/70">${c.suggestedPrice40.toFixed(2)}</td>
                  <td className="px-3 py-3 text-coffee/70">${c.suggestedPrice50.toFixed(2)}</td>
                  <td className="px-3 py-3">
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Fórmulas */}
      <Card padding="lg" className="bg-surface border-dashed">
        <h3 className="font-semibold text-coffee mb-3">Fórmulas utilizadas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-coffee/70 font-mono">
          {[
            "costo_total = costo_ingredientes + costo_empaque",
            "utilidad = precio_venta − costo_total",
            "margen = (utilidad / precio_venta) × 100",
            "precio_sugerido = costo_total / (1 − margen_objetivo)",
            "comisión_MP = precio_venta × 0.035",
            "utilidad_neta = utilidad − comisión_MP",
          ].map((f) => (
            <div key={f} className="bg-warm-white px-3 py-2 rounded-lg border border-border">{f}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}
