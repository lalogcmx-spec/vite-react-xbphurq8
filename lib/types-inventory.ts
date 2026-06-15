// ============================================================
// TIPOS — Módulo de Inventario / Surtidor / Costos
// ============================================================

export type SupplyUnit = "kg" | "g" | "litro" | "ml" | "pieza" | "paquete" | "caja" | "lata";

export type InventoryStatus = "suficiente" | "bajo" | "agotado";

export type Supplier = {
  id: string;
  name: string;
  phone?: string;
  location: string; // tianguis, bodega, etc.
};

export type Supply = {
  id: string;
  name: string;
  category: string; // verduras, lácteos, carnes, etc.
  baseUnit: SupplyUnit;
  currentStock: number;
  minStock: number;
  avgCost: number; // costo promedio por unidad base
  supplierId?: string;
  status: InventoryStatus;
};

export type Purchase = {
  id: string;
  date: string; // ISO date
  supplierId?: string;
  supplierName: string;
  supplyId: string;
  supplyName: string;
  quantity: number;
  unit: SupplyUnit;
  totalCost: number;
  unitCost: number; // totalCost / quantity
  previousUnitCost?: number; // para detectar alza de precio
  notes?: string;
  supplierId2?: string; // quién surtió (empleado/surtidor)
  surtidorName: string;
};

export type RecipeIngredient = {
  supplyId: string;
  supplyName: string;
  quantity: number;
  unit: SupplyUnit;
  unitCost: number;
  totalCost: number;
};

export type Recipe = {
  id: string;
  productId: string;
  productName: string;
  yieldQty: number; // cuántas unidades/porciones produce
  yieldUnit: string; // "porciones", "piezas", "250g"
  ingredients: RecipeIngredient[];
  packagingCost: number; // costo empaque por unidad
  // calculados:
  ingredientCost: number; // suma ingredientes / yieldQty
  totalUnitCost: number;  // ingredientCost + packagingCost
  sellingPrice: number;
  profit: number;         // sellingPrice - totalUnitCost
  margin: number;         // profit / sellingPrice * 100
};

export type ProductCost = {
  productId: string;
  productName: string;
  sellingPrice: number;
  productionCost: number;
  grossProfit: number;
  margin: number;         // %
  mpCommission: number;   // 3.5%
  netProfit: number;
  suggestedPrice30: number;
  suggestedPrice40: number;
  suggestedPrice50: number;
  suggestedPrice60: number;
  status: "rentable" | "margen_bajo" | "perdida";
};
