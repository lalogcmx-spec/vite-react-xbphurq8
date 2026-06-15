import Link from "next/link";
import { CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="text-center flex flex-col items-center gap-5 max-w-sm">
        <div className="w-20 h-20 rounded-full bg-green-subtle border border-green/20 flex items-center justify-center">
          <CheckCircle size={36} strokeWidth={1.5} className="text-green" />
        </div>
        <div>
          <h1
            style={{ fontFamily: "var(--font-display)" }}
            className="text-4xl font-semibold text-ink"
          >
            Pago exitoso
          </h1>
          <p className="text-ink-3 mt-2 text-sm leading-relaxed">
            Tu pago fue procesado correctamente. Prepararemos tu pedido de inmediato.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Link href="/menu"><Button variant="gold" size="lg" fullWidth>Ver menú</Button></Link>
          <Link href="/"><Button variant="ghost" size="md" fullWidth>Inicio</Button></Link>
        </div>
      </div>
    </div>
  );
}
