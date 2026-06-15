// ============================================================
// SUPABASE — Configuración y cliente (pendiente de credenciales)
// ============================================================
//
// Para activar:
// 1. npm install @supabase/supabase-js
// 2. Crear .env.local con:
//    NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
//    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
//    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
// 3. Descomentar el código de abajo
// 4. Reemplazar las funciones mock en lib/mock-data.ts
//    con llamadas reales a Supabase
//
// Tablas necesarias en Supabase:
//   categories (id, name, emoji, sort_order)
//   products (id, category_id, name, description, price, image_url, available, tags)
//   customers (id, name, phone, email, stamps, total_orders, total_spent, created_at)
//   orders (id, created_at, customer_id, delivery_type, delivery_address, status,
//           payment_method, payment_status, subtotal, total, notes, employee_id, source)
//   order_items (id, order_id, product_id, quantity, notes, unit_price)
//   employees (id, name, phone, role, active, access_token)
//   reward_rules (id, stamps_required, reward)
// ============================================================

// import { createClient } from "@supabase/supabase-js";
//
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
//
// export const supabase = createClient(supabaseUrl, supabaseAnonKey);
//
// // Cliente con privilegios de servidor (solo en Server Components / Route Handlers)
// export function createServerClient() {
//   return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
//     auth: { persistSession: false },
//   });
// }

export {}; // mantiene el módulo válido hasta activar Supabase
