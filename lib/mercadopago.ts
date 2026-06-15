// ============================================================
// MERCADO PAGO — Checkout Pro (pendiente de credenciales)
// ============================================================
//
// Para activar:
// 1. npm install mercadopago
// 2. Crear .env.local con:
//    MP_ACCESS_TOKEN=APP_USR-xxxx (token de producción o sandbox)
//    NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-xxxx
//    NEXT_PUBLIC_BASE_URL=https://tu-dominio.com (para webhooks)
// 3. Crear un Route Handler en app/api/checkout/route.ts
// 4. Crear webhooks en app/api/webhooks/mp/route.ts
//
// Flujo Checkout Pro:
//   1. Cliente selecciona "Mercado Pago" como método de pago
//   2. POST /api/checkout → crea preference con items del carrito
//   3. Redirigir a preference.init_point (URL de Mercado Pago)
//   4. MP redirige a:
//      - /success?payment_id=xxx  (pago exitoso)
//      - /pending?payment_id=xxx  (pago pendiente)
//      - /failure?payment_id=xxx  (pago fallido)
//   5. Webhook de MP notifica el estado final → actualizar Order en Supabase
// ============================================================

// import MercadoPagoConfig, { Preference } from "mercadopago";
//
// const client = new MercadoPagoConfig({
//   accessToken: process.env.MP_ACCESS_TOKEN!,
// });
//
// export async function createCheckoutPreference(order: Order) {
//   const preference = new Preference(client);
//   const response = await preference.create({
//     body: {
//       items: order.items.map((item) => ({
//         id: item.product.id,
//         title: item.product.name,
//         quantity: item.quantity,
//         unit_price: item.product.price,
//         currency_id: "MXN",
//       })),
//       back_urls: {
//         success: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
//         failure: `${process.env.NEXT_PUBLIC_BASE_URL}/failure`,
//         pending: `${process.env.NEXT_PUBLIC_BASE_URL}/pending`,
//       },
//       auto_return: "approved",
//       external_reference: order.id,
//       notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mp`,
//     },
//   });
//   return response;
// }

export {}; // mantiene el módulo válido hasta activar Mercado Pago
