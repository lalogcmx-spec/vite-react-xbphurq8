# 🍝 Rossy Gourmet — Cocina que enamora

Web app completa para gestión de pedidos, mostrador TPV, kiosko, inventario y administración de Rossy Gourmet.

---

## Stack

| Tecnología        | Versión  | Uso                          |
|-------------------|----------|------------------------------|
| Next.js           | 16.2.9   | Framework principal          |
| React             | 19       | UI                           |
| TypeScript        | 5        | Tipado                       |
| Tailwind CSS      | 4        | Estilos                      |
| Supabase          | pendiente| Base de datos + Auth         |
| Mercado Pago      | pendiente| Pagos online (Checkout Pro)  |
| WhatsApp wa.me    | activo   | Links directos sin API       |

---

## Correr localmente

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo de variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores reales

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir en el navegador
open http://localhost:3000
```

---

## Rutas disponibles

### Públicas / Cliente
| Ruta           | Descripción                           |
|----------------|---------------------------------------|
| `/`            | Home principal                        |
| `/menu`        | Menú con carrito                      |
| `/checkout`    | Formulario de pedido                  |
| `/pedido/[id]` | Confirmación de pedido                |
| `/success`     | Pago exitoso (Mercado Pago)           |
| `/pending`     | Pago pendiente (Mercado Pago)         |
| `/failure`     | Pago fallido (Mercado Pago)           |

### Operación
| Ruta         | Descripción                           |
|--------------|---------------------------------------|
| `/mostrador` | TPV para cajero/empleado              |
| `/kiosko`    | Autoservicio táctil                   |
| `/surtidor`  | Registro de compras (Papá)            |

### Admin
| Ruta                     | Descripción                    |
|--------------------------|--------------------------------|
| `/admin`                 | Dashboard                      |
| `/admin/login`           | Login de administrador         |
| `/admin/pedidos`         | Historial de pedidos           |
| `/admin/cocina`          | Pantalla de cocina (kanban)    |
| `/admin/productos`       | Catálogo de productos          |
| `/admin/clientes`        | Lista de clientes              |
| `/admin/empleados`       | Gestión de empleados           |
| `/admin/recompensas`     | Programa de sellos             |
| `/admin/inventario`      | Inventario de insumos          |
| `/admin/compras`         | Historial de compras           |
| `/admin/recetas`         | Recetas y costos de producción |
| `/admin/costos`          | Análisis de rentabilidad       |
| `/admin/reportes`        | Reportes generales             |
| `/admin/configuracion`   | Configuración del negocio      |

### API
| Endpoint                            | Descripción            |
|-------------------------------------|------------------------|
| `POST /api/mercadopago/create-preference` | Crear preferencia MP |
| `POST /api/mercadopago/webhook`     | Webhook de MP          |

---

## Variables de entorno

Copia `.env.example` como `.env.local` y rellena:

```
NEXT_PUBLIC_SUPABASE_URL=       # Panel Supabase → Settings → API
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Panel Supabase → Settings → API
SUPABASE_SERVICE_ROLE_KEY=      # Panel Supabase → Settings → API
MP_ACCESS_TOKEN=                # Panel MP Developers → Credenciales
NEXT_PUBLIC_APP_URL=            # Tu URL de producción
WHATSAPP_BUSINESS_PHONE=        # Ej: 5215512345678
```

---

## Comandos

```bash
npm run dev     # Servidor de desarrollo en localhost:3000
npm run build   # Build de producción
npm run lint    # Linter
npm start       # Servidor de producción (requiere build previo)
```

---

## Supabase — Configurar base de datos

1. Crear cuenta en [supabase.com](https://supabase.com)
2. Crear proyecto nuevo
3. Ir a **SQL Editor** → **New query**
4. Pegar el contenido de `supabase/schema.sql`
5. Clic **Run**
6. Copiar las credenciales en `.env.local`

---

## Mercado Pago — Activar pagos

1. Crear cuenta en [mercadopago.com.mx/developers](https://www.mercadopago.com.mx/developers/panel)
2. Crear aplicación
3. Obtener `Access Token` (modo sandbox para pruebas)
4. Agregar en `.env.local`:
   ```
   MP_ACCESS_TOKEN=APP_USR-xxxx
   NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app
   ```
5. En `app/api/mercadopago/create-preference/route.ts` descomentar el código activo
6. `npm install mercadopago`

---

## Deploy en Vercel — Paso a paso

> ⚠️ NO publicar hasta confirmar con el propietario del proyecto

1. **Subir a GitHub** (cuando se autorice):
   ```bash
   git init
   git add .
   git commit -m "feat: Rossy Gourmet app inicial"
   git remote add origin https://github.com/tuusuario/rossy-gourmet.git
   git push -u origin main
   ```

2. **Crear proyecto en Vercel**:
   - Ir a [vercel.com](https://vercel.com) → Import Project → GitHub
   - Seleccionar el repositorio `rossy-gourmet`
   - Framework: Next.js (auto-detectado)

3. **Variables de entorno en Vercel**:
   - Settings → Environment Variables
   - Agregar todas las variables del `.env.example` con valores reales

4. **Deploy**:
   - Clic en Deploy
   - Vercel genera URL automática: `rossy-gourmet.vercel.app`

5. **Dominio personalizado** (opcional):
   - Settings → Domains → Add domain

---

## Checklist antes de recibir clientes reales

- [ ] Supabase configurado y schema ejecutado
- [ ] Productos reales migrados a Supabase
- [ ] Autenticación de empleados activa
- [ ] WhatsApp Business Phone configurado en `.env.local`
- [ ] Mercado Pago en modo producción (no sandbox)
- [ ] Domicilio limitado a Coacalco y Tultitlán ✅ (ya configurado)
- [ ] URL de producción en NEXT_PUBLIC_APP_URL
- [ ] Probar flujo completo: menú → checkout → confirmación
- [ ] Probar mostrador con un pedido real
- [ ] Probar kiosko en tablet
- [ ] Revisar número de WhatsApp en `lib/whatsapp.ts` (constante ROSSY_PHONE)

---

## Reglas del negocio implementadas

- ✅ Cliente identificado por teléfono
- ✅ Cada compra pagada = 1 sello
- ✅ 5 sellos = postre gratis
- ✅ Domicilio solo Coacalco y Tultitlán
- ✅ Empleados con acceso propio (link por token)
- ✅ Kiosko no requiere empleado
- ✅ Venta en mostrador asociada a empleado activo
- ✅ Surtidor con alertas de precio al alza

---

## Licencia

Proyecto privado — Rossy Gourmet © 2026
