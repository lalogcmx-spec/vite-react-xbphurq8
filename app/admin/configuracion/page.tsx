import SectionTitle from "@/components/ui/SectionTitle";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ConfiguracionPage() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <SectionTitle title="Configuración" subtitle="Ajustes generales del negocio" />
      <div className="max-w-2xl flex flex-col gap-5">
        <Card padding="lg">
          <h3 className="font-semibold text-coffee mb-4">Datos del negocio</h3>
          <div className="flex flex-col gap-4">
            <Input label="Nombre del negocio" defaultValue="Rossy Gourmet" />
            <Input label="Teléfono de WhatsApp" defaultValue="+52 55 1234 5678" />
            <Input label="Slogan" defaultValue="Cocina que enamora" />
            <Input label="Zonas de domicilio" defaultValue="Coacalco, Tultitlán" hint="Separar con comas" />
          </div>
          <Button variant="gold" size="md" className="mt-4">Guardar cambios</Button>
        </Card>

        <Card padding="lg">
          <h3 className="font-semibold text-coffee mb-4">Integraciones</h3>
          <div className="flex flex-col gap-3">
            {[
              { label: "Supabase", status: "Pendiente", note: "Base de datos y autenticación" },
              { label: "Mercado Pago", status: "Pendiente", note: "Checkout Pro para pagos en línea" },
              { label: "WhatsApp wa.me", status: "Activo", note: "Links directos sin API" },
            ].map((int) => (
              <div key={int.label} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border">
                <div>
                  <p className="text-sm font-semibold text-coffee">{int.label}</p>
                  <p className="text-xs text-coffee/50">{int.note}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${int.status === "Activo" ? "bg-olive/15 text-olive" : "bg-gold/15 text-coffee"}`}>
                  {int.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="font-semibold text-coffee mb-2">Programa de recompensas</h3>
          <p className="text-xs text-coffee/50 mb-4">Sellos requeridos para cada premio</p>
          <div className="flex flex-col gap-3">
            <Input label="Sellos para postre gratis" defaultValue="5" type="number" />
            <Input label="Sellos para lasaña gratis" defaultValue="10" type="number" />
          </div>
          <Button variant="secondary" size="md" className="mt-4">Actualizar reglas</Button>
        </Card>
      </div>
    </div>
  );
}
