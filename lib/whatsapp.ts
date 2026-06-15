import type { Order } from "./types";

const ROSSY_PHONE = "525512345678"; // TODO: reemplazar con número real

function cleanPhone(phone: string): string {
  let clean = phone.replace(/\D/g, "");
  // Agregar código de México si no lo tiene
  if (clean.length === 10) clean = "52" + clean;
  return clean;
}

function encodeMsg(msg: string): string {
  return encodeURIComponent(msg);
}

export function waLink(phone: string, message: string): string {
  return `https://wa.me/${cleanPhone(phone)}?text=${encodeMsg(message)}`;
}

export function waOrderReceived(order: Order): string {
  const items = order.items
    .map((i) => `• ${i.quantity}x ${i.product.name}`)
    .join("\n");
  const msg =
    `🍝 *Rossy Gourmet* — Pedido recibido\n\n` +
    `Hola ${order.customer.name}, confirmamos tu pedido *#${order.id}*:\n\n` +
    `${items}\n\n` +
    `💰 Total: $${order.total} MXN\n` +
    `📦 Entrega: ${order.deliveryType === "pickup" ? "Recoger en tienda" : `Domicilio en ${order.deliveryAddress?.ciudad}`}\n\n` +
    `Te avisamos cuando esté listo. ¡Gracias por tu preferencia! 🙌`;
  return waLink(ROSSY_PHONE, msg);
}

export function waOrderReady(order: Order): string {
  const msg =
    `✅ *Rossy Gourmet* — ¡Tu pedido está listo!\n\n` +
    `Hola ${order.customer.name}, tu pedido *#${order.id}* está listo.\n\n` +
    (order.deliveryType === "pickup"
      ? `Puedes pasar a recogerlo. ¡Te esperamos! 🏠`
      : `Nuestro repartidor va en camino. 🛵`);
  return waLink(order.customer.phone, msg);
}

export function waOrderSummary(order: Order): string {
  const items = order.items
    .map((i) => `• ${i.quantity}x ${i.product.name} — $${(i.product.price * i.quantity).toFixed(0)}`)
    .join("\n");
  const msg =
    `🧾 *Resumen de tu pedido Rossy Gourmet*\n\n` +
    `#${order.id}\n\n` +
    `${items}\n\n` +
    `💰 Total: $${order.total} MXN\n` +
    `💳 Pago: ${order.paymentMethod}\n\n` +
    `¡Gracias por elegirnos! 🌿`;
  return waLink(order.customer.phone, msg);
}

export function waRewards(customerName: string, stamps: number, customerPhone: string): string {
  const remaining = 5 - (stamps % 5);
  const msg =
    `⭐ *Rossy Gourmet Rewards*\n\n` +
    `Hola ${customerName}! Tienes *${stamps} sello${stamps !== 1 ? "s" : ""}* acumulados.\n` +
    `Te faltan *${remaining}* para tu próximo premio gratuito. 🎁\n\n` +
    `¡Sigue disfrutando de nuestra cocina! 🍝`;
  return waLink(customerPhone, msg);
}

export function waContactRossy(message?: string): string {
  const msg = message ?? "Hola, me gustaría hacer un pedido en Rossy Gourmet. 🍝";
  return waLink(ROSSY_PHONE, msg);
}
