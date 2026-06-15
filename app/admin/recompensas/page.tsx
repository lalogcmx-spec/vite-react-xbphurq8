import { CUSTOMERS, REWARD_RULES } from "@/lib/mock-data";
import SectionTitle from "@/components/ui/SectionTitle";
import Card from "@/components/ui/Card";

export default function RecompensasPage() {
  const withPrize = CUSTOMERS.filter((c) => c.stamps >= 5);
  return (
    <div className="p-6 flex flex-col gap-6">
      <SectionTitle title="Recompensas" subtitle="Programa de sellos de Rossy Gourmet" />

      {/* Reglas */}
      <Card padding="lg">
        <h3 className="font-semibold text-coffee mb-4">Reglas del programa</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 p-3 bg-surface rounded-xl">
            <span className="text-2xl">🧾</span>
            <div>
              <p className="text-sm font-medium text-coffee">Cada compra pagada = 1 sello</p>
              <p className="text-xs text-coffee/50">Sin mínimo de compra. Se acumula automáticamente.</p>
            </div>
          </div>
          {REWARD_RULES.map((rule) => (
            <div key={rule.stampsRequired} className="flex items-center gap-3 p-3 bg-gold/10 border border-gold/20 rounded-xl">
              <span className="text-2xl">🎁</span>
              <div>
                <p className="text-sm font-medium text-coffee">{rule.stampsRequired} sellos → {rule.reward}</p>
                <p className="text-xs text-coffee/50">Premio canjeado al completar los sellos</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Clientes con premio */}
      {withPrize.length > 0 && (
        <Card padding="lg">
          <h3 className="font-semibold text-coffee mb-4">🎁 Clientes con premio disponible</h3>
          <div className="flex flex-col gap-2">
            {withPrize.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-gold/10 border border-gold/20 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-coffee/10 flex items-center justify-center font-bold text-coffee">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-coffee text-sm">{c.name}</p>
                  <p className="text-xs text-coffee/50">{c.stamps} sellos · {c.phone}</p>
                </div>
                <span className="text-xs bg-gold text-coffee font-bold px-3 py-1 rounded-full">Premio listo</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Todos los clientes */}
      <Card padding="lg">
        <h3 className="font-semibold text-coffee mb-4">Todos los clientes</h3>
        <div className="flex flex-col gap-2">
          {CUSTOMERS.map((c) => {
            const progress = c.stamps % 5;
            return (
              <div key={c.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="w-8 h-8 rounded-full bg-coffee/10 flex items-center justify-center font-bold text-coffee text-sm">
                  {c.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-coffee">{c.name}</p>
                  <div className="flex gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className={`w-3.5 h-3.5 rounded-full border ${i < progress ? "bg-gold border-gold" : "border-border"}`} />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-coffee/50">{c.stamps} sello{c.stamps !== 1 ? "s" : ""}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
