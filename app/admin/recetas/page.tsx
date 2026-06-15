import { RECIPES } from "@/lib/mock-inventory";
import SectionTitle from "@/components/ui/SectionTitle";
import Card from "@/components/ui/Card";

export default function RecetasPage() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <SectionTitle
        title="Recetas y Costos"
        subtitle={`${RECIPES.length} recetas con cálculo de costo por porción`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {RECIPES.map((recipe) => (
          <Card key={recipe.id} padding="lg">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <h3 className="font-bold text-coffee text-base">{recipe.productName}</h3>
                <p className="text-xs text-coffee/50 mt-0.5">
                  Rinde: {recipe.yieldQty} {recipe.yieldUnit}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-coffee/50">Precio venta</p>
                <p className="text-xl font-bold text-coffee">${recipe.sellingPrice}</p>
              </div>
            </div>

            {/* Ingredientes */}
            <div className="flex flex-col gap-1 mb-4">
              <p className="text-xs font-semibold text-coffee/50 uppercase tracking-wide mb-1">Ingredientes</p>
              {recipe.ingredients.map((ing, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
                  <span className="text-coffee/80">{ing.supplyName}</span>
                  <div className="text-right text-xs text-coffee/60">
                    <span>{ing.quantity} {ing.unit}</span>
                    <span className="ml-2 font-semibold text-coffee">${ing.totalCost.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Costos */}
            <div className="bg-surface rounded-xl p-3 flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between text-coffee/70">
                <span>Costo ingredientes</span>
                <span>${recipe.ingredientCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-coffee/70">
                <span>Empaque</span>
                <span>${recipe.packagingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-coffee border-t border-border pt-1.5 mt-0.5">
                <span>Costo total/u</span>
                <span>${recipe.totalUnitCost.toFixed(2)}</span>
              </div>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: "Utilidad", value: `$${recipe.profit.toFixed(2)}`, color: "text-olive" },
                { label: "Margen", value: `${recipe.margin.toFixed(1)}%`, color: recipe.margin >= 40 ? "text-olive" : "text-terracotta" },
                { label: "Precio", value: `$${recipe.sellingPrice}`, color: "text-coffee" },
              ].map((m) => (
                <div key={m.label} className="bg-surface rounded-xl p-2.5 text-center">
                  <p className="text-[10px] text-coffee/40 uppercase tracking-wide">{m.label}</p>
                  <p className={`text-base font-bold ${m.color}`}>{m.value}</p>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card padding="lg" className="border-dashed">
        <div className="text-center py-4 text-coffee/40">
          <span className="text-3xl">📝</span>
          <p className="mt-2 text-sm">Más recetas se agregarán conforme se documenten los costos reales de cada producto.</p>
          <p className="text-xs mt-1">Conectar a Supabase para editar recetas desde el panel.</p>
        </div>
      </Card>
    </div>
  );
}
