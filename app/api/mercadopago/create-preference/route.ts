import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

export async function POST(req: NextRequest) {
  if (!process.env.MP_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: "MP_ACCESS_TOKEN no configurado" },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { items, orderId, customerEmail } = body as {
      items: { name: string; price: number; qty: number }[];
      orderId: string;
      customerEmail?: string;
    };

    const client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN,
    });

    const preference = new Preference(client);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const response = await preference.create({
      body: {
        items: items.map((item) => ({
          id: item.name,
          title: item.name,
          quantity: item.qty,
          unit_price: item.price,
          currency_id: "MXN",
        })),
        payer: customerEmail ? { email: customerEmail } : undefined,
        back_urls: {
          success: `${appUrl}/success`,
          failure: `${appUrl}/failure`,
          pending: `${appUrl}/pending`,
        },
        auto_return: "approved",
        external_reference: orderId,
        notification_url: `${appUrl}/api/mercadopago/webhook`,
        statement_descriptor: "Rossy Gourmet",
      },
    });

    return NextResponse.json({ init_point: response.init_point });
  } catch (err) {
    console.error("[MP create-preference]", err);
    return NextResponse.json(
      { error: "Error al crear preferencia de pago" },
      { status: 500 }
    );
  }
}
