import axios from "axios";

interface AlertableTicket {
  id: string;
  numero_ticket: string | null;
  total: number | null;
}

// Si el driver agota selectores + Gemini Vision sin intervención humana,
// alguien debe enterarse — de lo contrario el fallo solo vive en logs
// que nadie revisa a las 2am.
export async function alertAdminOnFailure(
  comercio: string,
  ticket: AlertableTicket,
  errorMsg: string
): Promise<void> {
  const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;
  if (!adminNumber || !process.env.META_ACCESS_TOKEN || !process.env.META_PHONE_NUMBER_ID) {
    console.error(
      `[${comercio}] No se configuró ADMIN_WHATSAPP_NUMBER; no se pudo alertar sobre el fallo del ticket ${ticket.id}`
    );
    return;
  }

  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${process.env.META_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: adminNumber,
        type: "text",
        text: {
          preview_url: false,
          body:
            `🚨 *FacturaBot MX — Fallo en ${comercio}*\n\n` +
            `Ticket: ${ticket.id}\n` +
            `Folio: ${ticket.numero_ticket}\n` +
            `Total: $${ticket.total}\n\n` +
            `Error: ${errorMsg}\n\n` +
            `El driver agotó selectores + Gemini Vision. Revisa los artefactos de debug en el servidor.`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (alertErr: unknown) {
    const msg = alertErr instanceof Error ? alertErr.message : String(alertErr);
    console.error(`[${comercio}] No se pudo enviar alerta al admin: ${msg}`);
  }
}
