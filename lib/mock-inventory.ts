import type {
  Supplier,
  Supply,
  Purchase,
  Recipe,
  ProductCost,
} from "./types-inventory";

// ── Proveedores ────────────────────────────────────────────
export const SUPPLIERS: Supplier[] = [
  { id: "p001", name: "Central de Abastos", phone: "", location: "CDMX — Central de Abastos" },
  { id: "p002", name: "Mercado Buenavista", phone: "", location: "Coacalco — Mercado local" },
  { id: "p003", name: "Bodega Aurrerá", phone: "", location: "Coacalco — Tultepec" },
  { id: "p004", name: "Costco", phone: "", location: "Ecatepec" },
  { id: "p005", name: "Rancho directo", phone: "", location: "Proveedor local — verdura" },
];

// ── Insumos / Inventario ───────────────────────────────────
export const SUPPLIES: Supply[] = [
  { id: "s001", name: "Aguacate",           category: "Verduras",    baseUnit: "kg",     currentStock: 3.5,  minStock: 2,   avgCost: 45,  supplierId: "p001", status: "suficiente" },
  { id: "s002", name: "Chile cuaresmeño",   category: "Verduras",    baseUnit: "kg",     currentStock: 0.8,  minStock: 1,   avgCost: 30,  supplierId: "p001", status: "bajo" },
  { id: "s003", name: "Chile manzano",      category: "Verduras",    baseUnit: "kg",     currentStock: 0.5,  minStock: 0.5, avgCost: 60,  supplierId: "p001", status: "bajo" },
  { id: "s004", name: "Jitomate",           category: "Verduras",    baseUnit: "kg",     currentStock: 5,    minStock: 3,   avgCost: 18,  supplierId: "p002", status: "suficiente" },
  { id: "s005", name: "Cebolla",            category: "Verduras",    baseUnit: "kg",     currentStock: 4,    minStock: 2,   avgCost: 15,  supplierId: "p002", status: "suficiente" },
  { id: "s006", name: "Cilantro",           category: "Verduras",    baseUnit: "kg",     currentStock: 0.3,  minStock: 0.5, avgCost: 20,  supplierId: "p002", status: "bajo" },
  { id: "s007", name: "Pasta corta",        category: "Abarrotes",   baseUnit: "kg",     currentStock: 2,    minStock: 1,   avgCost: 22,  supplierId: "p003", status: "suficiente" },
  { id: "s008", name: "Mayonesa",           category: "Abarrotes",   baseUnit: "kg",     currentStock: 1.5,  minStock: 1,   avgCost: 55,  supplierId: "p003", status: "suficiente" },
  { id: "s009", name: "Jamón",              category: "Embutidos",   baseUnit: "kg",     currentStock: 0.8,  minStock: 1,   avgCost: 90,  supplierId: "p003", status: "bajo" },
  { id: "s010", name: "Piña en almíbar",    category: "Abarrotes",   baseUnit: "lata",   currentStock: 4,    minStock: 3,   avgCost: 25,  supplierId: "p003", status: "suficiente" },
  { id: "s011", name: "Zanahoria",          category: "Verduras",    baseUnit: "kg",     currentStock: 3,    minStock: 1,   avgCost: 12,  supplierId: "p002", status: "suficiente" },
  { id: "s012", name: "Papa",              category: "Verduras",    baseUnit: "kg",     currentStock: 5,    minStock: 2,   avgCost: 14,  supplierId: "p002", status: "suficiente" },
  { id: "s013", name: "Chícharo",          category: "Verduras",    baseUnit: "kg",     currentStock: 0,    minStock: 0.5, avgCost: 35,  supplierId: "p002", status: "agotado" },
  { id: "s014", name: "Arroz",             category: "Abarrotes",   baseUnit: "kg",     currentStock: 8,    minStock: 3,   avgCost: 20,  supplierId: "p003", status: "suficiente" },
  { id: "s015", name: "Salsa de soya",     category: "Abarrotes",   baseUnit: "litro",  currentStock: 0.5,  minStock: 0.5, avgCost: 45,  supplierId: "p003", status: "suficiente" },
  { id: "s016", name: "Pollo pechuga",     category: "Carnes",      baseUnit: "kg",     currentStock: 2,    minStock: 2,   avgCost: 85,  supplierId: "p001", status: "suficiente" },
  { id: "s017", name: "Pasta de rollo",    category: "Abarrotes",   baseUnit: "paquete",currentStock: 3,    minStock: 2,   avgCost: 38,  supplierId: "p004", status: "suficiente" },
  { id: "s018", name: "Queso Oaxaca",      category: "Lácteos",     baseUnit: "kg",     currentStock: 1.5,  minStock: 1,   avgCost: 120, supplierId: "p004", status: "suficiente" },
  { id: "s019", name: "Nopal",             category: "Verduras",    baseUnit: "kg",     currentStock: 2,    minStock: 1,   avgCost: 18,  supplierId: "p002", status: "suficiente" },
  { id: "s020", name: "Champiñón",         category: "Verduras",    baseUnit: "kg",     currentStock: 0.5,  minStock: 0.5, avgCost: 65,  supplierId: "p001", status: "suficiente" },
  { id: "s021", name: "Charola desechable",category: "Empaque",     baseUnit: "pieza",  currentStock: 200,  minStock: 100, avgCost: 1.5, supplierId: "p003", status: "suficiente" },
  { id: "s022", name: "Bolsa biodegradable",category:"Empaque",     baseUnit: "pieza",  currentStock: 80,   minStock: 100, avgCost: 1,   supplierId: "p003", status: "bajo" },
];

// ── Compras recientes ──────────────────────────────────────
export const PURCHASES: Purchase[] = [
  {
    id: "c001",
    date: "2026-06-12",
    supplierId: "p001",
    supplierName: "Central de Abastos",
    supplyId: "s001",
    supplyName: "Aguacate",
    quantity: 5,
    unit: "kg",
    totalCost: 225,
    unitCost: 45,
    previousUnitCost: 40,
    notes: "Precio subió $5 por kg",
    surtidorName: "Papá — Surtidor principal",
  },
  {
    id: "c002",
    date: "2026-06-12",
    supplierId: "p002",
    supplierName: "Mercado Buenavista",
    supplyId: "s004",
    supplyName: "Jitomate",
    quantity: 8,
    unit: "kg",
    totalCost: 144,
    unitCost: 18,
    previousUnitCost: 18,
    surtidorName: "Papá — Surtidor principal",
  },
  {
    id: "c003",
    date: "2026-06-11",
    supplierId: "p003",
    supplierName: "Bodega Aurrerá",
    supplyId: "s007",
    supplyName: "Pasta corta",
    quantity: 3,
    unit: "kg",
    totalCost: 66,
    unitCost: 22,
    previousUnitCost: 22,
    surtidorName: "Papá — Surtidor principal",
  },
  {
    id: "c004",
    date: "2026-06-11",
    supplierId: "p004",
    supplierName: "Costco",
    supplyId: "s018",
    supplyName: "Queso Oaxaca",
    quantity: 2,
    unit: "kg",
    totalCost: 240,
    unitCost: 120,
    previousUnitCost: 115,
    notes: "Subió $5/kg vs. semana pasada",
    surtidorName: "Papá — Surtidor principal",
  },
  {
    id: "c005",
    date: "2026-06-10",
    supplierId: "p003",
    supplierName: "Bodega Aurrerá",
    supplyId: "s017",
    supplyName: "Pasta de rollo",
    quantity: 5,
    unit: "paquete",
    totalCost: 190,
    unitCost: 38,
    previousUnitCost: 38,
    surtidorName: "Papá — Surtidor principal",
  },
];

// ── Recetas ────────────────────────────────────────────────
// Costo calculado por porción de 250 g o pieza según producto
export const RECIPES: Recipe[] = [
  {
    id: "r001",
    productId: "rajas-verdes",
    productName: "Rajas Verdes",
    yieldQty: 1,
    yieldUnit: "250 g",
    ingredients: [
      { supplyId: "s001", supplyName: "Aguacate",      quantity: 0.08, unit: "kg", unitCost: 45, totalCost: 3.6 },
      { supplyId: "s005", supplyName: "Cebolla",        quantity: 0.05, unit: "kg", unitCost: 15, totalCost: 0.75 },
      { supplyId: "s002", supplyName: "Chile cuaresmeño", quantity: 0.04, unit: "kg", unitCost: 30, totalCost: 1.2 },
    ],
    packagingCost: 2.5,
    ingredientCost: 5.55,
    totalUnitCost: 8.05,
    sellingPrice: 50,
    profit: 41.95,
    margin: 83.9,
  },
  {
    id: "r002",
    productId: "pico-gallo",
    productName: "Pico de Gallo",
    yieldQty: 1,
    yieldUnit: "250 g",
    ingredients: [
      { supplyId: "s004", supplyName: "Jitomate",  quantity: 0.1,  unit: "kg", unitCost: 18, totalCost: 1.8 },
      { supplyId: "s001", supplyName: "Aguacate",  quantity: 0.06, unit: "kg", unitCost: 45, totalCost: 2.7 },
      { supplyId: "s005", supplyName: "Cebolla",   quantity: 0.05, unit: "kg", unitCost: 15, totalCost: 0.75 },
      { supplyId: "s006", supplyName: "Cilantro",  quantity: 0.01, unit: "kg", unitCost: 20, totalCost: 0.2 },
    ],
    packagingCost: 2.5,
    ingredientCost: 5.45,
    totalUnitCost: 7.95,
    sellingPrice: 50,
    profit: 42.05,
    margin: 84.1,
  },
  {
    id: "r003",
    productId: "sopa-fria",
    productName: "Sopa Fría Normal",
    yieldQty: 1,
    yieldUnit: "250 g",
    ingredients: [
      { supplyId: "s007", supplyName: "Pasta corta", quantity: 0.1,  unit: "kg", unitCost: 22, totalCost: 2.2 },
      { supplyId: "s008", supplyName: "Mayonesa",    quantity: 0.05, unit: "kg", unitCost: 55, totalCost: 2.75 },
      { supplyId: "s009", supplyName: "Jamón",       quantity: 0.05, unit: "kg", unitCost: 90, totalCost: 4.5 },
    ],
    packagingCost: 2.5,
    ingredientCost: 9.45,
    totalUnitCost: 11.95,
    sellingPrice: 45,
    profit: 33.05,
    margin: 73.4,
  },
  {
    id: "r004",
    productId: "ensalada-rusa",
    productName: "Ensalada Rusa",
    yieldQty: 1,
    yieldUnit: "250 g",
    ingredients: [
      { supplyId: "s011", supplyName: "Zanahoria", quantity: 0.07, unit: "kg", unitCost: 12, totalCost: 0.84 },
      { supplyId: "s013", supplyName: "Chícharo",  quantity: 0.06, unit: "kg", unitCost: 35, totalCost: 2.1 },
      { supplyId: "s012", supplyName: "Papa",      quantity: 0.08, unit: "kg", unitCost: 14, totalCost: 1.12 },
      { supplyId: "s008", supplyName: "Mayonesa",  quantity: 0.05, unit: "kg", unitCost: 55, totalCost: 2.75 },
    ],
    packagingCost: 2.5,
    ingredientCost: 6.81,
    totalUnitCost: 9.31,
    sellingPrice: 50,
    profit: 40.69,
    margin: 81.4,
  },
  {
    id: "r005",
    productId: "arroz-rojo",
    productName: "Arroz Rojo",
    yieldQty: 1,
    yieldUnit: "250 g",
    ingredients: [
      { supplyId: "s014", supplyName: "Arroz",     quantity: 0.12, unit: "kg", unitCost: 20, totalCost: 2.4 },
      { supplyId: "s004", supplyName: "Jitomate",  quantity: 0.04, unit: "kg", unitCost: 18, totalCost: 0.72 },
      { supplyId: "s011", supplyName: "Zanahoria", quantity: 0.02, unit: "kg", unitCost: 12, totalCost: 0.24 },
      { supplyId: "s013", supplyName: "Chícharo",  quantity: 0.02, unit: "kg", unitCost: 35, totalCost: 0.7 },
    ],
    packagingCost: 2.5,
    ingredientCost: 4.06,
    totalUnitCost: 6.56,
    sellingPrice: 30,
    profit: 23.44,
    margin: 78.1,
  },
  {
    id: "r006",
    productId: "rollo-hawaiano",
    productName: "Rollo Primavera Hawaiano",
    yieldQty: 1,
    yieldUnit: "pieza",
    ingredients: [
      { supplyId: "s017", supplyName: "Pasta de rollo", quantity: 0.2,  unit: "pieza", unitCost: 38, totalCost: 7.6 },
      { supplyId: "s018", supplyName: "Queso Oaxaca",   quantity: 0.03, unit: "kg",    unitCost: 120, totalCost: 3.6 },
      { supplyId: "s009", supplyName: "Jamón",          quantity: 0.02, unit: "kg",    unitCost: 90,  totalCost: 1.8 },
      { supplyId: "s010", supplyName: "Piña en almíbar", quantity: 0.03, unit: "kg",   unitCost: 12,  totalCost: 0.36 },
    ],
    packagingCost: 0.5,
    ingredientCost: 13.36,
    totalUnitCost: 13.86,
    sellingPrice: 20,
    profit: 6.14,
    margin: 30.7,
  },
  {
    id: "r007",
    productId: "rollo-pollo-verdura",
    productName: "Rollo Primavera Pollo con Verdura",
    yieldQty: 1,
    yieldUnit: "pieza",
    ingredients: [
      { supplyId: "s017", supplyName: "Pasta de rollo", quantity: 0.2,  unit: "pieza", unitCost: 38, totalCost: 7.6 },
      { supplyId: "s016", supplyName: "Pollo pechuga",  quantity: 0.03, unit: "kg",    unitCost: 85, totalCost: 2.55 },
      { supplyId: "s011", supplyName: "Zanahoria",      quantity: 0.02, unit: "kg",    unitCost: 12, totalCost: 0.24 },
    ],
    packagingCost: 0.5,
    ingredientCost: 10.39,
    totalUnitCost: 10.89,
    sellingPrice: 20,
    profit: 9.11,
    margin: 45.6,
  },
];

// ── Costos calculados por producto ─────────────────────────
function calcCosts(r: Recipe): ProductCost {
  const commission = r.sellingPrice * 0.035;
  const netProfit = r.profit - commission;
  const costBase = r.totalUnitCost;
  return {
    productId: r.productId,
    productName: r.productName,
    sellingPrice: r.sellingPrice,
    productionCost: r.totalUnitCost,
    grossProfit: r.profit,
    margin: r.margin,
    mpCommission: parseFloat(commission.toFixed(2)),
    netProfit: parseFloat(netProfit.toFixed(2)),
    suggestedPrice30: parseFloat((costBase / 0.70).toFixed(2)),
    suggestedPrice40: parseFloat((costBase / 0.60).toFixed(2)),
    suggestedPrice50: parseFloat((costBase / 0.50).toFixed(2)),
    suggestedPrice60: parseFloat((costBase / 0.40).toFixed(2)),
    status: r.margin >= 40 ? "rentable" : r.margin >= 20 ? "margen_bajo" : "perdida",
  };
}

export const PRODUCT_COSTS: ProductCost[] = RECIPES.map(calcCosts);

// ── Totales de inventario ──────────────────────────────────
export function getInventoryValue(): number {
  return SUPPLIES.reduce((sum, s) => sum + s.currentStock * s.avgCost, 0);
}

export function getPurchasesToday(date: string): Purchase[] {
  return PURCHASES.filter((p) => p.date === date);
}

export function getTotalSpentToday(date: string): number {
  return getPurchasesToday(date).reduce((sum, p) => sum + p.totalCost, 0);
}
