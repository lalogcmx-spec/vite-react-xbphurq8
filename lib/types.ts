// ============================================================
// ROSSY GOURMET — Tipos globales
// ============================================================

// --- Catálogo ---

export type Category = {
  id: string;
  name: string;
  emoji: string;
  sortOrder: number;
};

export type Product = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageEmoji: string; // placeholder hasta tener imágenes reales
  unit: string; // ej: "250 g", "pieza"
  available: boolean;
  tags?: string[];
};

// --- Carrito ---

export type CartItem = {
  product: Product;
  quantity: number;
  notes?: string;
};

// --- Pedidos ---

export type DeliveryType = "pickup" | "delivery";

export type OrderStatus =
  | "nuevo"
  | "aceptado"
  | "preparando"
  | "listo"
  | "entregado"
  | "cancelado";

export type PaymentMethod =
  | "efectivo"
  | "transferencia"
  | "terminal"
  | "mercadopago"
  | "pendiente";

export type PaymentStatus = "pendiente" | "pagado" | "fallido" | "reembolsado";

export type DeliveryAddress = {
  street: string;
  colonia: string;
  ciudad: "Coacalco" | "Tultitlán";
  cp: string;
  references?: string;
};

export type Order = {
  id: string;
  createdAt: string; // ISO string
  customer: Customer;
  items: CartItem[];
  deliveryType: DeliveryType;
  deliveryAddress?: DeliveryAddress;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  total: number;
  notes?: string;
  employeeId?: string; // quién tomó la orden en mostrador
  source: "online" | "mostrador" | "kiosko";
};

// --- Clientes ---

export type Customer = {
  id: string;
  name: string;
  phone: string; // identificador principal
  email?: string;
  stamps: number; // sellos acumulados
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
};

// --- Empleados ---

export type EmployeeRole = "admin" | "cajero" | "cocina" | "repartidor";

export type Employee = {
  id: string;
  name: string;
  phone: string;
  role: EmployeeRole;
  active: boolean;
  todaySales: number;
  totalSales: number;
  lastSaleAt?: string;
  accessLink?: string;
};

// --- Recompensas ---

export type RewardRule = {
  stampsRequired: number;
  reward: string; // descripción del premio
};

// ============================================================
// Futura integración — NO borrar estos comentarios
// ============================================================

// Supabase: cada tipo aquí mapea a una tabla en la base de datos.
// Ver lib/supabase.ts para los nombres de tablas y configuración.

// Mercado Pago: Order.paymentMethod === 'mercadopago' activa
// el flujo de Checkout Pro. Ver lib/mercadopago.ts.
