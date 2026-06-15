"use client";

import { useState } from "react";
import { PURCHASES, SUPPLIES } from "@/lib/mock-inventory";
import type { SupplyUnit, Purchase } from "@/lib/types-inventory";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Link from "next/link";

const UNITS: SupplyUnit[] = ["kg", "g", "litro", "ml", "pieza", "paquete", "caja", "lata"];
const SURTIDOR_ACTIVE = "Papá — Surtidor principal";
const TODAY = "2026-06-12";

type FormState = {
  supplyName: string;
  category: string;
  supplier: string;
  quantity: string;
  unit: SupplyUnit;
  totalCost: string;
  notes: string;
};

const EMPTY: FormState = {
  supplyName: "",
  category: "",
  supplier: "",
  quantity: "",
  unit: "kg",
  totalCost: "",
  notes: "",
};

export default function SurtidorPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [purchases, setPurchases] = useState<Purchase[]>(PURCHASES);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const qty = parseFloat(form.quantity) || 0;
  const cost = parseFloat(form.totalCost) || 0;
  const unitCost = qty > 0 ? cost / qty : 0;

  const todayPurchases = purchases.filter((p) => p.date === TODAY);
  const todayTotal = todayPurchases.reduce((s, p) => s + p.totalCost, 0);

  // Detectar si el insumo subió de precio
  const lastBuy = purchases.find(
    (p) => p.supplyName.toLowerCase() === form.supplyName.toLowerCase() && p.date !== TODAY
  );
  const priceAlert = lastBuy && unitCost > 0 && unitCost > lastBuy.unitCost;

  const validate = () => {
    const e: Partial<FormState> = {};
    if (!form.supplyName.trim()) e.supplyName = "Ingresa el nombre del insumo";
    if (!form.supplier.trim()) e.supplier = "Ingresa el proveedor o lugar";
    if (!form.quantity.trim() || qty <= 0) e.quantity = "Ingresa una cantidad válida";
    if (!form.totalCost.trim() || cost <= 0) e.totalCost = "Ingresa el costo total";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const newPurchase: Purchase = {
      id: `c${Date.now()}`,
      date: TODAY,
      supplierName: form.supplier,
      supplyId: `s-${Date.now()}`,
      supplyName: form.supplyName,
      quantity: qty,
      unit: form.unit,
      totalCost: cost,
      unitCost,
      previousUnitCost: lastBuy?.unitCost,
      notes: form.notes || undefined,
      surtidorName: SURTIDOR_ACTIVE,
    };
    setPurchases((prev) => [newPurchase, ...prev]);
    setForm(EMPTY);
    setErrors({});
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Insumos con stock bajo como sugerencia
  const lowStock = SUPPLIES.filter((s) => s.status === "bajo" || s.status === "agotado");

  return (
    <div className="min-h-screen bg-warm-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-coffee text-cream px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚚</span>
          <div>
            <p className="font-bold text-sm leading-tight">Modo Surtidor</p>
            <p className="text-gold text-[10px]">{SURTIDOR_ACTIVE}</p>
          </div>
        </div>
        <Link href="/admin/compras" className="text-cream/60 text-xs hover:text-cream transition-colors">
          Ver historial →
        </Link>
      </header>

      <div className="max-w-lg mx-auto w-full px-4 py-5 flex flex-col gap-5">
        {/* KPI del día */}
        <div className="grid grid-cols-2 gap-3">
          <Card padding="md" className="border-gold/20">
            <p className="text-xs text-coffee/50">Gastado hoy</p>
            <p className="text-2xl font-bold text-coffee">${todayTotal.toFixed(0)}</p>
          </Card>
          <Card padding="md" className="border-gold/20">
            <p className="text-xs text-coffee/50">Compras hoy</p>
            <p className="text-2xl font-bold text-coffee">{todayPurchases.length}</p>
          </Card>
        </div>

        {/* Alertas de stock bajo */}
        {lowStock.length > 0 && (
          <div className="bg-terracotta/10 border border-terracotta/30 rounded-2xl p-3">
            <p className="text-xs font-semibold text-terracotta mb-1.5">
              ⚠️ Necesitan surtirse
            </p>
            <div className="flex flex-wrap gap-1.5">
              {lowStock.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setForm((f) => ({ ...f, supplyName: s.name, unit: s.baseUnit as SupplyUnit }))}
                  className="text-xs bg-warm-white border border-terracotta/30 text-terracotta px-2.5 py-1 rounded-full cursor-pointer hover:bg-terracotta/10 transition-all"
                >
                  {s.name} {s.status === "agotado" ? "🚫" : "⚡"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Formulario de compra */}
        <Card padding="lg">
          <h2 className="font-bold text-coffee mb-4 flex items-center gap-2">
            <span className="text-xl">🛒</span>
            Registrar compra
          </h2>

          <div className="flex flex-col gap-4">
            <Input
              label="Insumo comprado"
              value={form.supplyName}
              onChange={(e) => setForm((f) => ({ ...f, supplyName: e.target.value }))}
              error={errors.supplyName}
              placeholder="Aguacate, jitomate, queso..."
            />

            <Input
              label="Categoría (opcional)"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="Verduras, lácteos, abarrotes..."
            />

            <Input
              label="Proveedor / Lugar"
              value={form.supplier}
              onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
              error={errors.supplier}
              placeholder="Central de Abastos, Mercado local..."
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Cantidad comprada"
                type="number"
                min="0"
                step="0.1"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                error={errors.quantity}
                placeholder="5"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-coffee-light">Unidad</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value as SupplyUnit }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-warm-white text-sm text-coffee outline-none focus:border-gold focus:ring-2 focus:ring-gold/20"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Costo total ($)"
              type="number"
              min="0"
              step="1"
              value={form.totalCost}
              onChange={(e) => setForm((f) => ({ ...f, totalCost: e.target.value }))}
              error={errors.totalCost}
              placeholder="225"
            />

            {/* Cálculo automático de costo unitario */}
            {qty > 0 && cost > 0 && (
              <div className="bg-surface border border-border rounded-xl px-4 py-3 flex justify-between items-center">
                <span className="text-sm text-coffee/70">Costo por {form.unit}</span>
                <span className="font-bold text-coffee text-base">${unitCost.toFixed(2)}</span>
              </div>
            )}

            {/* Alerta de precio al alza */}
            {priceAlert && lastBuy && (
              <div className="bg-terracotta/10 border border-terracotta/30 rounded-xl p-3 flex gap-2">
                <span className="text-terracotta">⚠️</span>
                <div>
                  <p className="text-terracotta text-sm font-semibold">Precio más alto que antes</p>
                  <p className="text-terracotta/80 text-xs">
                    Antes: ${lastBuy.unitCost}/{form.unit} · Ahora: ${unitCost.toFixed(2)}/{form.unit}
                    {" "}(+${(unitCost - lastBuy.unitCost).toFixed(2)})
                  </p>
                </div>
              </div>
            )}

            <Input
              label="Notas (opcional)"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Observaciones, estado del producto..."
            />

            {/* Foto placeholder */}
            <div className="border-2 border-dashed border-border rounded-xl p-4 text-center text-coffee/40">
              <p className="text-2xl mb-1">📸</p>
              <p className="text-xs">Foto de ticket — próximamente</p>
              <p className="text-[10px] mt-0.5">Se conectará con almacenamiento en Supabase</p>
            </div>

            {saved && (
              <div className="bg-olive/15 border border-olive/30 rounded-xl px-4 py-3 text-olive text-sm font-semibold text-center">
                ✅ Compra registrada correctamente
              </div>
            )}

            <Button variant="gold" size="lg" fullWidth onClick={handleSave}>
              Guardar compra
            </Button>
          </div>
        </Card>

        {/* Compras del día */}
        {todayPurchases.length > 0 && (
          <Card padding="lg">
            <h3 className="font-semibold text-coffee mb-3">Compras de hoy</h3>
            <div className="flex flex-col gap-2">
              {todayPurchases.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-coffee">{p.supplyName}</p>
                    <p className="text-xs text-coffee/50">
                      {p.quantity} {p.unit} · {p.supplierName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-coffee text-sm">${p.totalCost}</p>
                    <p className="text-[10px] text-coffee/40">${p.unitCost.toFixed(2)}/{p.unit}</p>
                  </div>
                  {p.previousUnitCost !== undefined && p.unitCost > p.previousUnitCost && (
                    <span className="text-terracotta text-xs font-bold">↑</span>
                  )}
                </div>
              ))}
              <div className="flex justify-between font-bold text-coffee pt-2">
                <span>Total del día</span>
                <span>${todayTotal.toFixed(0)}</span>
              </div>
            </div>
          </Card>
        )}

        <div className="pb-6 text-center">
          <Link href="/admin" className="text-sm text-coffee/40 hover:text-coffee transition-colors">
            ← Volver al admin
          </Link>
        </div>
      </div>
    </div>
  );
}
