import Link from "next/link";
import { Clock } from "lucide-react";
import Button from "@/components/ui/Button";

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="text-center flex flex-col items-center gap-5 max-w-sm">
        <div className="w-20 h-20 rounded-full bg-gold-subtle border border-gold/20 flex items-center justify-center">
          <Clock size={36} strokeWidth={1.5} className="text-gold" />
        </div>
        <div>
          <h1
            style={{ fontFamily: "var(--font-display)" }}
            className="text-4xl font-semibold text-ink"
          >
            Pago pendiente
          </h1>
          <p className="text-ink-3 mt-2 text-sm leading-relaxed">
            Tu pago está siendo procesado. Recibirás una notificación cuando se confirme.
          </p>
        </div>
        <Link href="/"><Button variant="gold" size="lg" fullWidth>Volver al inicio</Button></Link>
      </div>
    </div>
  );
}
