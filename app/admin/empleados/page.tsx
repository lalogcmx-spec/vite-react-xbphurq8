import { EMPLOYEES } from "@/lib/mock-data";
import SectionTitle from "@/components/ui/SectionTitle";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  cajero: "Cajero",
  cocina: "Cocina",
  repartidor: "Repartidor",
};

export default function EmpleadosPage() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <SectionTitle title="Empleados" subtitle={`${EMPLOYEES.filter((e) => e.active).length} activos · ${EMPLOYEES.length} en total`} />
        <button className="px-3 py-2 bg-gold text-coffee text-sm font-semibold rounded-xl hover:bg-gold-light cursor-pointer transition-all">
          + Agregar empleado
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EMPLOYEES.map((emp) => (
          <Card key={emp.id} padding="md">
            <div className="flex items-start gap-3">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${emp.active ? "bg-olive/15 text-olive" : "bg-border text-coffee/40"}`}>
                {emp.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-coffee">{emp.name}</h3>
                  <Badge variant={emp.active ? "olive" : "neutral"}>{emp.active ? "Activo" : "Inactivo"}</Badge>
                  <Badge variant="gold">{ROLE_LABELS[emp.role]}</Badge>
                </div>
                <p className="text-xs text-coffee/50 mt-0.5">{emp.phone}</p>
                <div className="grid grid-cols-2 gap-3 mt-3 text-center">
                  <div className="bg-surface rounded-lg p-2">
                    <p className="text-[11px] text-coffee/40">Ventas hoy</p>
                    <p className="font-bold text-coffee text-sm">{emp.todaySales}</p>
                  </div>
                  <div className="bg-surface rounded-lg p-2">
                    <p className="text-[11px] text-coffee/40">Total</p>
                    <p className="font-bold text-coffee text-sm">${emp.totalSales}</p>
                  </div>
                </div>
                {emp.lastSaleAt && (
                  <p className="text-[11px] text-coffee/40 mt-2">
                    Última venta: {new Date(emp.lastSaleAt).toLocaleString("es-MX", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                  </p>
                )}
                <button className="mt-3 w-full py-1.5 border border-border rounded-lg text-xs font-medium text-coffee/60 hover:bg-surface cursor-pointer transition-all">
                  🔗 Generar link de acceso
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
