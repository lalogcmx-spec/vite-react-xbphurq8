export type TicketStatus =
  | 'recibido'
  | 'esperando_confirmacion'
  | 'en_cola_facturacion'
  | 'facturado'
  | 'error';

export interface Ticket {
  id: string;
  comercio: string | null;
  total: number | null;
  fecha: string | null;
  status: TicketStatus;
  xml_url: string | null;
  pdf_url: string | null;
  error_message: string | null;
  created_at: string;
}

export interface Plan {
  id: string;
  price: number;
  ticketsPerMonth: number;
  rfcs: number;
  popular?: boolean;
}
