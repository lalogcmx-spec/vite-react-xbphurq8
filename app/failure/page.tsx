import Link from "next/link";
import { XCircle } from "lucide-react";
import Button from "@/components/ui/Button";

export default function FailurePage() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="text-center flex flex-col items-center gap-5 max-w-sm">
        <div className="w-20 h-20 rounded-full bg-red-subtle border border-red/20 flex items-center justify-center">
          <XCircle size={36} strokeWidth={1.5} className="text-red" />
        </div>
        <div>
          <h1
            style={{ fontFamily: "var(--font-display)" }}
            className="text-4xl font-semibold text-ink"
          >
            Pago no completado
          </h1>
          <p className="text-ink-3 mt-2 text-sm leading-relaxed">
            Hubo un problema con tu pago. Por favor intenta de nuevo o elige otro método.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Link href="/checkout"><Button variant="primary" size="lg" fullWidth>Intentar de nuevo</Button></Link>
          <Link href="/"><Button variant="ghost" size="md" fullWidth>Inicio</Button></Link>
        </div>
      </div>
    </div>
  );
}
