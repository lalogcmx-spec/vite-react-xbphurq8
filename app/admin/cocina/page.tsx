"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { ORDERS } from "@/lib/mock-data";
import type { Order, OrderStatus } from "@/lib/types";
import SectionTitle from "@/components/ui/SectionTitle";
import OrderCard from "@/components/features/OrderCard";

type Column = {
  status: OrderStatus;
  label: string;
  dotColor: string;
  headerBg: string;
};

const STATUS_COLUMNS: Column[] = [
  {
    status:    "nuevo",
    label:     "Nuevos",
    dotColor:  "bg-gold",
    headerBg:  "bg-gold-subtle border-gold/30",
  },
  {
    status:    "aceptado",
    label:     "Aceptados",
    dotColor:  "bg-ink-3",
    headerBg:  "bg-surface border-border",
  },
  {
    status:    "preparando",
    label:     "Preparando",
    dotColor:  "bg-red",
    headerBg:  "bg-red-subtle border-red/30",
  },
  {
    status:    "listo",
    label:     "Listos",
    dotColor:  "bg-green",
    headerBg:  "bg-green-subtle border-green/30",
  },
];

export default function CocinaPage() {
  const [orders, setOrders] = useState<Order[]>(ORDERS);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const activeOrders = orders.filter(
    (o) => o.status !== "entregado" && o.status !== "cancelado"
  );
  const newCount = activeOrders.filter((o) => o.status === "nuevo").length;
  const completed = orders.filter(
    (o) => o.status === "entregado" || o.status === "cancelado"
  );

  return (
    <div className="p-6 flex flex-col gap-6 min-h-screen">
      <div className="flex items-center justify-between">
        <SectionTitle title="Cocina" subtitle="Gestiona el estado de cada pedido" />
        {newCount > 0 && (
          <div className="flex items-center gap-2 bg-red-subtle border border-red/30 rounded-lg px-3 py-2">
            <Bell size={14} className="text-red animate-bounce" />
            <span className="text-red font-semibold text-sm">
              {newCount} pedido{newCount > 1 ? "s" : ""} nuevo{newCount > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
        {STATUS_COLUMNS.map(({ status, label, dotColor, headerBg }) => {
          const colOrders = activeOrders.filter((o) => o.status === status);
          return (
            <div key={status} className="flex flex-col gap-2">
              {/* Column header */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${headerBg}`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                <h3 className="font-semibold text-ink text-sm flex-1">{label}</h3>
                <span className="bg-ink/10 text-ink text-xs font-bold px-1.5 py-0.5 rounded-md tabular-nums">
                  {colOrders.length}
                </span>
              </div>
              {/* Cards */}
              <div className="flex flex-col gap-2">
                {colOrders.length === 0 && (
                  <div className="border border-dashed border-border rounded-xl py-10 text-center text-ink-4 text-xs">
                    Sin pedidos
                  </div>
                )}
                {colOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    showActions
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ink-4 mb-3 uppercase tracking-wider">Completados</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 opacity-50">
            {completed.map((o) => (
              <OrderCard key={o.id} order={o} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
