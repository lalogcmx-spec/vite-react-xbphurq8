import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { type, data } = body as { type?: string; data?: { id?: string } };

  console.log("[MP Webhook]", { type, id: data?.id });

  if (type === "payment" && data?.id && process.env.MP_ACCESS_TOKEN) {
    try {
      const client = new MercadoPagoConfig({
        accessToken: process.env.MP_ACCESS_TOKEN,
      });
      const payment = await new Payment(client).get({ id: data.id });

      console.log("[MP Webhook] payment status:", payment.status, "order:", payment.external_reference);

      // Cuando Supabase esté activo:
      // await updateOrderPaymentStatus(payment.external_reference, payment.status);
    } catch (err) {
      console.error("[MP Webhook] error fetching payment:", err);
    }
  }

  // MP exige 200 para dejar de reintentar
  return NextResponse.json({ received: true });
}
