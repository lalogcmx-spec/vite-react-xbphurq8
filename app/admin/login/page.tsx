import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-coffee flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <span className="text-5xl">🍝</span>
          <h1 className="text-2xl font-bold text-cream mt-2">Rossy Gourmet</h1>
          <p className="text-gold text-sm">Panel de administración</p>
        </div>
        <Card padding="lg">
          <h2 className="font-semibold text-coffee mb-5">Iniciar sesión</h2>
          <form className="flex flex-col gap-4">
            <Input label="Correo" type="email" placeholder="admin@rossygourmet.com" />
            <Input label="Contraseña" type="password" placeholder="••••••••" />
            <Link href="/admin">
              <Button variant="gold" fullWidth size="lg">Entrar</Button>
            </Link>
          </form>
          <p className="text-xs text-coffee/40 text-center mt-4">
            Autenticación con Supabase Auth próximamente
          </p>
        </Card>
        <Link href="/" className="text-cream/40 text-sm text-center hover:text-cream transition-colors">← Volver al sitio</Link>
      </div>
    </div>
  );
}
