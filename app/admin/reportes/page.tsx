import { ORDERS, CUSTOMERS, PRODUCTS } from "@/lib/mock-data";
import SectionTitle from "@/components/ui/SectionTitle";
import Card from "@/components/ui/Card";

export default function ReportesPage() {
  const paid = ORDERS.filter((o) => o.paymentStatus === "pagado");
  const total = paid.reduce((s, o) => s + o.total, 0);
  const byMethod = paid.reduce<Record<string, number>>((acc, o) => {
    acc[o.paymentMethod] = (acc[o.paymentMethod] ?? 0) + o.total;
    return acc;
  }, {});

  return (
    <div className="p-6 flex flex-col gap-6">
      <SectionTitle title="Reportes" subtitle="Vista de datos mock — conectar a Supabase para reportes reales" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Ingresos totales", value: `$${total}`, emoji: "💰" },
          { label: "Pedidos pagados", value: paid.length, emoji: "✅" },
          { label: "Clientes únicos", value: CUSTOMERS.length, emoji: "👥" },
          { label: "Productos activos", value: PRODUCTS.filter((p) => p.available).length, emoji: "🍽️" },
        ].map((k) => (
          <Card key={k.label} padding="md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-coffee/50">{k.label}</p>
                <p className="text-2xl font-bold text-coffee mt-1">{k.value}</p>
              </div>
              <span className="text-3xl">{k.emoji}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card padding="lg">
        <h3 className="font-semibold text-coffee mb-4">Ingresos por método de pago</h3>
        <div className="flex flex-col gap-2">
          {Object.entries(byMethod).map(([method, amount]) => (
            <div key={method} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-coffee capitalize">{method}</span>
              <span className="font-bold text-coffee">${amount}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="lg" className="border-dashed">
        <div className="text-center py-6 text-coffee/40">
          <span className="text-4xl">📊</span>
          <p className="mt-2 text-sm">Gráficas y reportes avanzados disponibles al conectar Supabase</p>
        </div>
      </Card>
    </div>
  );
}
