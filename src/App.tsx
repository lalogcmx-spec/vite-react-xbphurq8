import { useState } from "react";

const MENU = {
  "Guarniciones": [
    { id: 1,  name: "Arroz Rojo",            desc: "Con jitomate, chícharo y zanahoria",              price: 30, img: "🍚", unit: "250g" },
    { id: 2,  name: "Arroz Chino",           desc: "Con salsa de soya, germen de soya y pollo",       price: 45, img: "🍚", unit: "250g" },
    { id: 3,  name: "Espagueti",             desc: "Estilo oriental con verduras",                    price: 45, img: "🍝", unit: "250g" },
    { id: 4,  name: "Verdura al Horno",      desc: "Con aceite de oliva",                             price: 40, img: "🥦", unit: "250g" },
    { id: 5,  name: "Papas al Horno",        desc: "Papas cambray con finas hierbas",                 price: 40, img: "🥔", unit: "250g" },
    { id: 6,  name: "Papa al Horno con Chile", desc: "Papas cambray con finas hierbas y chile de árbol", price: 40, img: "🌶️", unit: "250g" },
  ],
  "Ensaladas": [
    { id: 7,  name: "Rajas Verdes",          desc: "Aguacate, cebolla y chile cuaresmeño",            price: 50, img: "🥗", unit: "250g" },
    { id: 8,  name: "Rajas de Manzano",      desc: "Aguacate, cebolla, chile manzano y habanero",     price: 50, img: "🌿", unit: "250g" },
    { id: 9,  name: "Pico de Gallo",         desc: "Jitomate, aguacate y cebolla",                    price: 50, img: "🍅", unit: "250g" },
    { id: 10, name: "Sopa Fría Normal",      desc: "Pasta con mayonesa y jamón",                      price: 45, img: "🥙", unit: "250g" },
    { id: 11, name: "Sopa Fría con Piña",    desc: "Pasta con mayonesa, jamón y piña",                price: 45, img: "🍍", unit: "250g" },
    { id: 12, name: "Ensalada Rusa",         desc: "Zanahoria, chícharo, papa y mayonesa",            price: 50, img: "🥗", unit: "250g" },
    { id: 13, name: "Lechuga Preparada",     desc: "Lechuga, jitomate cherry, jícama y zanahoria",    price: 25, img: "🥬", unit: "250g" },
    { id: 14, name: "Nopal Natural",         desc: "Nopal hervido con cilantro y cebolla",            price: 40, img: "🌵", unit: "250g" },
    { id: 15, name: "Nopal con Chile",       desc: "Nopal frito con cilantro, cebolla y chile de árbol", price: 40, img: "🌵", unit: "250g" },
    { id: 16, name: "Habas",                 desc: "Habas hervidas con cebolla y cilantro",           price: 40, img: "🫘", unit: "250g" },
    { id: 17, name: "Quelite",               desc: "Quelites fritos con cebolla",                     price: 45, img: "🌿", unit: "250g" },
    { id: 18, name: "Champiñón en Escabeche", desc: "Champiñón en escabeche",                        price: 50, img: "🍄", unit: "250g" },
    { id: 19, name: "Coliflor en Escabeche", desc: "Coliflor en escabeche",                          price: 45, img: "🥦", unit: "250g" },
    { id: 20, name: "Chiles con Tocino",     desc: "Chile jalapeño relleno de queso y envuelto en tocino", price: 35, img: "🌶️", unit: "pza" },
    { id: 21, name: "Chile Relleno",         desc: "Chile poblano relleno de queso, capeado",         price: 40, img: "🫑", unit: "pza" },
  ],
  "Especiales": [
    { id: 22, name: "Pata para Tostada",     desc: "Pata de res con col",                             price: 60, img: "🦴", unit: "250g" },
    { id: 23, name: "Pata de Res",           desc: "Pata de res en escabeche",                        price: 75, img: "🦴", unit: "250g" },
    { id: 24, name: "Molleja",               desc: "Mollejas hervidas y fritas con chile de árbol",   price: 70, img: "🍖", unit: "250g" },
  ],
  "Rollos": [
    { id: 25, name: "Rollo Hawaiano",        desc: "Piña, queso y jamón",                             price: 18, img: "🌮", unit: "pza" },
    { id: 26, name: "Pollo con Verdura",     desc: "Pollo y verduras",                                price: 18, img: "🌮", unit: "pza" },
    { id: 27, name: "Champiñón con Queso",   desc: "Champiñón y queso",                               price: 18, img: "🌮", unit: "pza" },
    { id: 28, name: "Carne al Pastor",       desc: "Pastor, piña y queso",                            price: 18, img: "🌮", unit: "pza" },
    { id: 29, name: "Pastor con Pollo",      desc: "Pastor, pollo, piña y queso",                     price: 18, img: "🌮", unit: "pza" },
    { id: 30, name: "Rajas con Queso",       desc: "Rajas y queso",                                   price: 18, img: "🌮", unit: "pza" },
    { id: 31, name: "Pepperoni",             desc: "Pepperoni y queso",                               price: 18, img: "🌮", unit: "pza" },
    { id: 32, name: "Rollo Zarzamora",       desc: "Zarzamora y queso Philadelphia",                  price: 18, img: "🍓", unit: "pza" },
    { id: 33, name: "Piña con Queso",        desc: "Piña y queso Philadelphia",                       price: 18, img: "🍍", unit: "pza" },
  ],
  "Paquetes": [
    { id: 34, name: "Paquete 1",  desc: "½ kg de Rajas",                                              price: 90,  img: "📦", unit: "paq" },
    { id: 35, name: "Paquete 2",  desc: "3 platillos de $45",                                         price: 120, img: "📦", unit: "paq" },
    { id: 36, name: "Paquete 3",  desc: "2 Rollos + Arroz Chino o Espagueti o Combinado",             price: 79,  img: "📦", unit: "paq" },
    { id: 37, name: "Paquete 4",  desc: "5 Tortas de Papa + Salsa chica o grande + Lechuga",          price: 110, img: "📦", unit: "paq" },
    { id: 38, name: "Paquete 5",  desc: "6 Rollos + ½ Sopa Fría",                                    price: 180, img: "📦", unit: "paq" },
    { id: 39, name: "Paquete 6",  desc: "12 Rollos",                                                  price: 190, img: "📦", unit: "paq" },
    { id: 40, name: "Paquete 7",  desc: "14 Rollos",                                                  price: 220, img: "📦", unit: "paq" },
  ],
};

const STEPS = ["Menú", "Carrito", "Pedido", "Seguimiento"];
const CASHBACK_RATE = 0.01;
const DELIVERY_FEE = 35;

function QtyControl({ qty, onInc, onDec }: { qty: number; onInc: () => void; onDec: () => void }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <button onClick={onDec} style={{ width:28, height:28, borderRadius:"50%", border:"1.5px solid #ddd", background:"#fff", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
      <span style={{ fontWeight:700, minWidth:16, textAlign:"center", fontSize:14 }}>{qty}</span>
      <button onClick={onInc} style={{ width:28, height:28, borderRadius:"50%", border:"1.5px solid #111", background:"#111", color:"#fff", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
    </div>
  );
}

function OrderTracker({ order, onBack }: { order: any; onBack: () => void }) {
  const [status, setStatus] = useState(0);
  const statuses = order.type === "delivery"
    ? ["Pedido recibido ✅", "Preparando 🍳", "En camino 🛵", "Entregado 🎉"]
    : ["Pedido recibido ✅", "Preparando 🍳", "Listo para recoger 🏪", "Completado ✅"];

  return (
    <div style={{ maxWidth:440, margin:"0 auto", padding:24 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <span style={{ fontSize:28 }}>👩‍🍳</span>
        <div>
          <div style={{ fontWeight:800, fontSize:18 }}>Rossy Gourmet</div>
          <div style={{ color:"#888", fontSize:12 }}>Orden #{order.id} · {order.type === "delivery" ? "Delivery 🛵" : "Pick Up 🏪"}</div>
        </div>
      </div>

      <div style={{ background:"#f7f7f7", borderRadius:14, padding:20, marginBottom:16 }}>
        {statuses.map((s, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:12, marginBottom: i < statuses.length-1 ? 16 : 0 }}>
            <div style={{ width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
              background: i <= status ? "#c0392b" : "#e0e0e0", color:"#fff", fontSize:13, fontWeight:700, flexShrink:0 }}>
              {i < status ? "✓" : i+1}
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight: i === status ? 700 : 400, color: i <= status ? "#111" : "#aaa" }}>{s}</div>
              {i === status && <div style={{ fontSize:11, color:"#c0392b" }}>Estado actual</div>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:"#f7f7f7", borderRadius:14, padding:16, marginBottom:16, fontSize:13 }}>
        <div style={{ fontWeight:600, marginBottom:8 }}>Resumen del pedido</div>
        {order.items.map((it: any, i: number) => (
          <div key={i} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span>{it.img} {it.name} {it.qty > 1 ? `×${it.qty}` : ""}</span>
            <span>${it.price * it.qty}</span>
          </div>
        ))}
        {order.type === "delivery" &&
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, color:"#888" }}>
            <span>🛵 Envío</span><span>${order.deliveryFee}</span>
          </div>}
        <div style={{ borderTop:"1px solid #e0e0e0", marginTop:8, paddingTop:8 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontWeight:700 }}><span>Total</span><span>${order.total}</span></div>
          <div style={{ display:"flex", justifyContent:"space-between", color:"#22c55e", fontWeight:600, marginTop:4 }}>
            <span>💰 Cashback ganado (1%)</span><span>+${(order.subtotal * CASHBACK_RATE).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {status < statuses.length - 1 &&
        <button onClick={() => setStatus(s => s+1)}
          style={{ width:"100%", padding:12, borderRadius:12, border:"none", background:"#c0392b", color:"#fff", cursor:"pointer", fontSize:14, marginBottom:10, fontWeight:600 }}>
          Simular siguiente estado →
        </button>}
      <button onClick={onBack}
        style={{ width:"100%", padding:12, borderRadius:12, border:"1.5px solid #ddd", background:"#fff", cursor:"pointer", fontSize:14 }}>
        ← Volver al inicio
      </button>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(0);
  const [cart, setCart] = useState<Record<number, any>>({});
  const [activeCategory, setActiveCategory] = useState("Guarniciones");
  const [orderType, setOrderType] = useState("pickup");
  const [address, setAddress] = useState("");
  const [order, setOrder] = useState<any>(null);
  const cashbackBalance = 12.50;

  const cartItems = Object.values(cart).filter((i: any) => i.qty > 0);
  const total = cartItems.reduce((s: number, i: any) => s + i.price * i.qty, 0);
  const totalQty = cartItems.reduce((s: number, i: any) => s + i.qty, 0);
  const cashback = (total * CASHBACK_RATE).toFixed(2);
  const deliveryFee = orderType === "delivery" ? DELIVERY_FEE : 0;
  const grandTotal = total + deliveryFee;

  const setQty = (item: any, qty: number) => {
    if (qty <= 0) {
      const c = { ...cart };
      delete c[item.id];
      setCart(c);
    } else {
      setCart(c => ({ ...c, [item.id]: { ...item, qty } }));
    }
  };

  const placeOrder = () => {
    setOrder({ id: Math.floor(100000 + Math.random() * 900000), items: cartItems, subtotal: total, deliveryFee, total: grandTotal, type: orderType, address });
    setStep(3);
  };

  if (step === 3 && order) return <OrderTracker order={order} onBack={() => { setStep(0); setCart({}); setOrder(null); }} />;

  return (
    <div style={{ fontFamily:"'Segoe UI', sans-serif", minHeight:"100vh", background:"#fafafa", color:"#111" }}>
      {/* Header */}
      <div style={{ background:"#c0392b", padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:28 }}>👩‍🍳</span>
          <div>
            <div style={{ fontWeight:800, fontSize:17, color:"#fff", letterSpacing:"-0.3px" }}>Rossy Gourmet</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.75)" }}>Deliciosa Tradición · Sabor Casero</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ fontSize:11, color:"#fff", background:"rgba(255,255,255,0.2)", borderRadius:20, padding:"4px 10px", fontWeight:600 }}>💰 ${cashbackBalance.toFixed(2)}</div>
          <button onClick={() => setStep(1)}
            style={{ background:"#fff", color:"#c0392b", border:"none", borderRadius:20, padding:"7px 14px", fontSize:13, cursor:"pointer", fontWeight:700 }}>
            🛒 {totalQty > 0 ? `${totalQty} · $${total}` : "Carrito"}
          </button>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display:"flex", background:"#fff", borderBottom:"1px solid #f0f0f0" }}>
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => i <= 2 && setStep(i)}
            style={{ flex:1, padding:"9px 4px", border:"none", borderBottom: step===i ? "2.5px solid #c0392b" : "2.5px solid transparent",
              background:"none", fontSize:11, fontWeight: step===i ? 700 : 400, cursor:"pointer", color: step===i ? "#c0392b" : "#aaa" }}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:520, margin:"0 auto", padding:"14px 12px" }}>

        {/* MENU */}
        {step === 0 && <>
          <div style={{ display:"flex", gap:7, marginBottom:14, overflowX:"auto", paddingBottom:4 }}>
            {Object.keys(MENU).map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                style={{ padding:"6px 14px", borderRadius:20, border:"1.5px solid", flexShrink:0, cursor:"pointer", fontSize:12,
                  borderColor: activeCategory===cat ? "#c0392b" : "#e0e0e0",
                  background: activeCategory===cat ? "#c0392b" : "#fff",
                  color: activeCategory===cat ? "#fff" : "#444", fontWeight: activeCategory===cat ? 700 : 400 }}>
                {cat}
              </button>
            ))}
          </div>

          {activeCategory === "Rollos" && (
            <div style={{ background:"#fff8f0", border:"1px solid #fde8d8", borderRadius:12, padding:"10px 14px", marginBottom:12, fontSize:12, color:"#c0392b", fontWeight:600 }}>
              🌮 Rollos Primavera — $18 la pieza · Salados y Dulces
            </div>
          )}

          {(MENU as any)[activeCategory].map((item: any) => {
            const qty = cart[item.id]?.qty || 0;
            return (
              <div key={item.id} style={{ background:"#fff", borderRadius:14, padding:"12px 14px", marginBottom:10, display:"flex", alignItems:"center", gap:12, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize:32, flexShrink:0 }}>{item.img}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{item.name}</div>
                  <div style={{ fontSize:11, color:"#888", marginTop:1, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{item.desc}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:"#c0392b", marginTop:4 }}>${item.price} <span style={{ fontSize:10, color:"#aaa", fontWeight:400 }}>/ {item.unit}</span></div>
                </div>
                <div style={{ flexShrink:0 }}>
                  {qty === 0
                    ? <button onClick={() => setQty(item, 1)}
                        style={{ background:"#c0392b", color:"#fff", border:"none", borderRadius:10, padding:"7px 14px", fontSize:13, cursor:"pointer", fontWeight:700 }}>+ Agregar</button>
                    : <QtyControl qty={qty} onInc={() => setQty(item, qty+1)} onDec={() => setQty(item, qty-1)} />
                  }
                </div>
              </div>
            );
          })}

          {totalQty > 0 &&
            <div style={{ position:"sticky", bottom:12, marginTop:8 }}>
              <button onClick={() => setStep(1)}
                style={{ width:"100%", padding:"14px", borderRadius:14, border:"none", background:"#c0392b", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 16px rgba(192,57,43,0.35)" }}>
                Ver carrito ({totalQty} productos) — ${total} →
              </button>
            </div>
          }
        </>}

        {/* CART */}
        {step === 1 && <>
          <h2 style={{ fontSize:19, marginBottom:14 }}>Tu carrito</h2>
          {cartItems.length === 0
            ? <div style={{ textAlign:"center", color:"#aaa", padding:"40px 0", fontSize:15 }}>
                <div style={{ fontSize:40 }}>🛒</div>
                <div style={{ marginTop:8 }}>Tu carrito está vacío</div>
              </div>
            : <>
              {cartItems.map((item: any) => (
                <div key={item.id} style={{ background:"#fff", borderRadius:14, padding:"12px 14px", marginBottom:10, display:"flex", alignItems:"center", gap:12, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize:28 }}>{item.img}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:600, fontSize:14 }}>{item.name}</div>
                    <div style={{ fontSize:12, color:"#c0392b", fontWeight:700 }}>${item.price * item.qty}</div>
                  </div>
                  <QtyControl qty={item.qty} onInc={() => setQty(item, item.qty+1)} onDec={() => setQty(item, item.qty-1)} />
                </div>
              ))}

              <div style={{ background:"#f7f7f7", borderRadius:14, padding:16, marginTop:8, fontSize:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}><span>Subtotal</span><span>${total}</span></div>
                <div style={{ display:"flex", justifyContent:"space-between", color:"#22c55e", fontWeight:600 }}><span>💰 Cashback (1%)</span><span>+${cashback}</span></div>
                <div style={{ borderTop:"1px solid #e0e0e0", marginTop:8, paddingTop:8, display:"flex", justifyContent:"space-between", fontWeight:700, fontSize:16 }}>
                  <span>Total</span><span>${total}</span>
                </div>
              </div>

              <button onClick={() => setStep(2)}
                style={{ width:"100%", marginTop:12, padding:"13px", borderRadius:12, border:"none", background:"#c0392b", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer" }}>
                Continuar al pedido →
              </button>
            </>
          }
          <button onClick={() => setStep(0)}
            style={{ width:"100%", marginTop:10, padding:"12px", borderRadius:12, border:"1.5px solid #ddd", background:"#fff", fontSize:14, cursor:"pointer" }}>
            ← Seguir comprando
          </button>
        </>}

        {/* ORDER TYPE */}
        {step === 2 && <>
          <h2 style={{ fontSize:19, marginBottom:14 }}>Tipo de entrega</h2>
          <div style={{ display:"flex", gap:10, marginBottom:18 }}>
            {([["pickup","🏪","Pick Up","Recoge en tienda"],["delivery","🛵","Delivery","Lo llevamos a tu puerta"]] as const).map(([val, ico, label, sub]) => (
              <button key={val} onClick={() => setOrderType(val)}
                style={{ flex:1, padding:"16px 10px", borderRadius:14, border:"2px solid", cursor:"pointer", textAlign:"center",
                  borderColor: orderType===val ? "#c0392b" : "#e0e0e0",
                  background: orderType===val ? "#c0392b" : "#fff",
                  color: orderType===val ? "#fff" : "#444" }}>
                <div style={{ fontSize:24 }}>{ico}</div>
                <div style={{ fontWeight:700, fontSize:14, marginTop:4 }}>{label}</div>
                <div style={{ fontSize:11, opacity:0.75, marginTop:2 }}>{sub}</div>
              </button>
            ))}
          </div>

          {orderType === "delivery" && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>Dirección de entrega</div>
              <input value={address} onChange={e => setAddress(e.target.value)}
                placeholder="Calle, número, colonia..."
                style={{ width:"100%", padding:"10px 12px", borderRadius:10, border:"1.5px solid #ddd", fontSize:13, boxSizing:"border-box" }} />
            </div>
          )}

          <div style={{ background:"#f7f7f7", borderRadius:14, padding:16, marginBottom:14, fontSize:13 }}>
            <div style={{ fontWeight:600, marginBottom:8 }}>Resumen</div>
            {cartItems.map((it: any, i: number) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span>{it.img} {it.name} {it.qty > 1 ? `×${it.qty}` : ""}</span><span>${it.price * it.qty}</span>
              </div>
            ))}
            {orderType === "delivery" &&
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, color:"#888" }}>
                <span>🛵 Envío</span><span>${deliveryFee}</span>
              </div>}
            <div style={{ borderTop:"1px solid #e0e0e0", marginTop:8, paddingTop:8 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontWeight:700 }}><span>Total</span><span>${grandTotal}</span></div>
              <div style={{ display:"flex", justifyContent:"space-between", color:"#22c55e", fontWeight:600, marginTop:4 }}>
                <span>💰 Cashback que ganarás</span><span>+${cashback}</span>
              </div>
            </div>
          </div>

          <button onClick={placeOrder}
            disabled={orderType === "delivery" && !address.trim()}
            style={{ width:"100%", padding:"13px", borderRadius:12, border:"none",
              background: (orderType === "delivery" && !address.trim()) ? "#ccc" : "#c0392b",
              color:"#fff", fontSize:15, fontWeight:700, cursor: (orderType==="delivery" && !address.trim()) ? "not-allowed" : "pointer" }}>
            ✅ Confirmar pedido
          </button>
          <button onClick={() => setStep(1)}
            style={{ width:"100%", marginTop:10, padding:"12px", borderRadius:12, border:"1.5px solid #ddd", background:"#fff", fontSize:14, cursor:"pointer" }}>
            ← Volver al carrito
          </button>
        </>}
      </div>
    </div>
  );
}
