-- ============================================================
-- ROSSY GOURMET — Schema SQL para Supabase
-- Pegar completo en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Configuración del negocio ─────────────────────────────
CREATE TABLE IF NOT EXISTS configuracion_negocio (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave           TEXT UNIQUE NOT NULL,
  valor           TEXT,
  descripcion     TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO configuracion_negocio (clave, valor, descripcion) VALUES
  ('nombre_negocio',    'Rossy Gourmet',    'Nombre del negocio'),
  ('slogan',            'Cocina que enamora','Slogan del negocio'),
  ('whatsapp_phone',    '',                  'Teléfono WA con código país'),
  ('zonas_domicilio',   'Coacalco,Tultitlán','Ciudades con domicilio'),
  ('sellos_por_pedido', '1',                 'Sellos ganados por pedido'),
  ('sellos_para_premio','5',                 'Sellos requeridos para premio')
ON CONFLICT (clave) DO NOTHING;

-- ── Categorías ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      TEXT NOT NULL,
  emoji       TEXT DEFAULT '🍽️',
  sort_order  INT DEFAULT 0,
  activo      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Productos ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  nombre       TEXT NOT NULL,
  descripcion  TEXT,
  precio       NUMERIC(10,2) NOT NULL,
  unidad       TEXT DEFAULT '250 g',
  imagen_url   TEXT,
  imagen_emoji TEXT DEFAULT '🍽️',
  disponible   BOOLEAN DEFAULT TRUE,
  tags         TEXT[],
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Clientes ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre        TEXT NOT NULL,
  telefono      TEXT UNIQUE NOT NULL,
  email         TEXT,
  sellos        INT DEFAULT 0,
  total_pedidos INT DEFAULT 0,
  total_gastado NUMERIC(12,2) DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Empleados ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS empleados (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       TEXT NOT NULL,
  telefono     TEXT,
  rol          TEXT DEFAULT 'cajero', -- admin | cajero | cocina | repartidor | surtidor
  activo       BOOLEAN DEFAULT TRUE,
  access_token TEXT UNIQUE DEFAULT uuid_generate_v4()::TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Surtidores ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS surtidores (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      TEXT NOT NULL,
  telefono    TEXT,
  activo      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Insumos / Inventario ──────────────────────────────────
CREATE TABLE IF NOT EXISTS inventario (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre         TEXT NOT NULL,
  categoria      TEXT,
  unidad_base    TEXT NOT NULL, -- kg, g, litro, ml, pieza, paquete, caja
  stock_actual   NUMERIC(12,3) DEFAULT 0,
  stock_minimo   NUMERIC(12,3) DEFAULT 0,
  costo_promedio NUMERIC(10,4) DEFAULT 0,
  proveedor_id   UUID,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Proveedores ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proveedores (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      TEXT NOT NULL,
  telefono    TEXT,
  ubicacion   TEXT,
  activo      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventario
  ADD CONSTRAINT fk_inventario_proveedor
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL;

-- ── Compras ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compras (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  proveedor_id    UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  proveedor_nombre TEXT,
  insumo_id       UUID REFERENCES inventario(id) ON DELETE SET NULL,
  insumo_nombre   TEXT NOT NULL,
  cantidad        NUMERIC(12,3) NOT NULL,
  unidad          TEXT NOT NULL,
  costo_total     NUMERIC(10,2) NOT NULL,
  costo_unitario  NUMERIC(10,4) NOT NULL,
  costo_anterior  NUMERIC(10,4),
  notas           TEXT,
  foto_ticket_url TEXT,
  surtidor_id     UUID REFERENCES surtidores(id) ON DELETE SET NULL,
  surtidor_nombre TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Recetas ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recetas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id     UUID REFERENCES productos(id) ON DELETE CASCADE,
  nombre          TEXT NOT NULL,
  rendimiento_qty NUMERIC(10,3) DEFAULT 1,
  rendimiento_unit TEXT DEFAULT 'porción',
  costo_empaque   NUMERIC(10,4) DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingredientes_receta (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  receta_id   UUID REFERENCES recetas(id) ON DELETE CASCADE,
  insumo_id   UUID REFERENCES inventario(id) ON DELETE SET NULL,
  insumo_nombre TEXT NOT NULL,
  cantidad    NUMERIC(12,4) NOT NULL,
  unidad      TEXT NOT NULL,
  costo_unit  NUMERIC(10,4) DEFAULT 0
);

-- ── Costos de producto (calculados / registrados) ─────────
CREATE TABLE IF NOT EXISTS costos_producto (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  producto_id      UUID REFERENCES productos(id) ON DELETE CASCADE,
  costo_produccion NUMERIC(10,4) DEFAULT 0,
  precio_venta     NUMERIC(10,2) DEFAULT 0,
  margen_objetivo  NUMERIC(5,2) DEFAULT 40, -- %
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Pedidos ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id       UUID REFERENCES clientes(id) ON DELETE SET NULL,
  empleado_id      UUID REFERENCES empleados(id) ON DELETE SET NULL,
  tipo_entrega     TEXT DEFAULT 'pickup', -- pickup | delivery
  direccion        JSONB,
  estado           TEXT DEFAULT 'nuevo', -- nuevo|aceptado|preparando|listo|entregado|cancelado
  metodo_pago      TEXT DEFAULT 'pendiente',
  estado_pago      TEXT DEFAULT 'pendiente', -- pendiente|pagado|fallido|reembolsado
  subtotal         NUMERIC(12,2) DEFAULT 0,
  total            NUMERIC(12,2) DEFAULT 0,
  notas            TEXT,
  fuente           TEXT DEFAULT 'online', -- online|mostrador|kiosko
  mp_preference_id TEXT,
  mp_payment_id    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS detalle_pedido (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id   UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
  nombre      TEXT NOT NULL,
  cantidad    INT NOT NULL DEFAULT 1,
  precio_unit NUMERIC(10,2) NOT NULL,
  notas       TEXT
);

-- ── Recompensas ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recompensas (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sellos_requeridos INT NOT NULL,
  descripcion      TEXT NOT NULL,
  activo           BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO recompensas (sellos_requeridos, descripcion) VALUES
  (5,  'Postre gratis a elegir'),
  (10, 'Producto gratis a elegir')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS canjes_recompensas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id    UUID REFERENCES clientes(id) ON DELETE SET NULL,
  recompensa_id UUID REFERENCES recompensas(id) ON DELETE SET NULL,
  descripcion   TEXT,
  sellos_usados INT DEFAULT 0,
  empleado_id   UUID REFERENCES empleados(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS (Row Level Security) — base ──────────────────────
-- Activar para cada tabla cuando tengas autenticación de Supabase
-- ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "empleados pueden ver pedidos" ON pedidos FOR SELECT USING (auth.role() = 'authenticated');

-- ── Índices de rendimiento ────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pedidos_estado    ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_created   ON pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_detalle_pedido    ON detalle_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_compras_fecha     ON compras(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_ingredientes_rec  ON ingredientes_receta(receta_id);

-- ── Vista útil: pedidos con cliente ──────────────────────
CREATE OR REPLACE VIEW pedidos_con_cliente AS
  SELECT
    p.*,
    c.nombre  AS cliente_nombre,
    c.telefono AS cliente_telefono,
    c.sellos  AS cliente_sellos
  FROM pedidos p
  LEFT JOIN clientes c ON p.cliente_id = c.id;
