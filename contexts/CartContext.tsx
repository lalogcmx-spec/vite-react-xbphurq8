"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { CartItem, Product } from "@/lib/types";

const STORAGE_KEY = "rossy-cart";

type CartState = { items: CartItem[] };

type CartAction =
  | { type: "ADD"; product: Product }
  | { type: "REMOVE"; productId: string }
  | { type: "SET_QTY"; productId: string; quantity: number }
  | { type: "SET_NOTES"; productId: string; notes: string }
  | { type: "CLEAR" }
  | { type: "HYDRATE"; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "HYDRATE":
      return { items: action.items };
    case "ADD": {
      const existing = state.items.find((i) => i.product.id === action.product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === action.product.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { product: action.product, quantity: 1 }] };
    }
    case "REMOVE":
      return { items: state.items.filter((i) => i.product.id !== action.productId) };
    case "SET_QTY":
      if (action.quantity <= 0)
        return { items: state.items.filter((i) => i.product.id !== action.productId) };
      return {
        items: state.items.map((i) =>
          i.product.id === action.productId ? { ...i, quantity: action.quantity } : i
        ),
      };
    case "SET_NOTES":
      return {
        items: state.items.map((i) =>
          i.product.id === action.productId ? { ...i, notes: action.notes } : i
        ),
      };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  setNotes: (productId: string, notes: string) => void;
  clear: () => void;
  subtotal: number;
  total: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Hidratar desde localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          dispatch({ type: "HYDRATE", items: parsed });
        }
      }
    } catch {
      // ignorar errores de JSON inválido
    }
  }, []);

  // Persistir en localStorage en cada cambio
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // ignorar en entornos sin localStorage
    }
  }, [state.items]);

  const addItem = useCallback((product: Product) => dispatch({ type: "ADD", product }), []);
  const removeItem = useCallback((productId: string) => dispatch({ type: "REMOVE", productId }), []);
  const setQuantity = useCallback(
    (productId: string, quantity: number) => dispatch({ type: "SET_QTY", productId, quantity }),
    []
  );
  const setNotes = useCallback(
    (productId: string, notes: string) => dispatch({ type: "SET_NOTES", productId, notes }),
    []
  );
  const clear = useCallback(() => {
    dispatch({ type: "CLEAR" });
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  }, []);

  const subtotal = state.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const total = subtotal;
  const count = state.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items: state.items, addItem, removeItem, setQuantity, setNotes, clear, subtotal, total, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
