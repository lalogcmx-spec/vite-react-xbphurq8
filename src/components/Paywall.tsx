import { useState } from 'react';
import { Plan } from '../types';

const PLANS: Plan[] = [
  { id: 'basico', price: 99, ticketsPerMonth: 10, rfcs: 1 },
  { id: 'popular', price: 299, ticketsPerMonth: 60, rfcs: 2, popular: true },
];

interface Props {
  onClose: () => void;
  onSubscribe: (planId: string) => void;
}

const Paywall = ({ onClose, onSubscribe }: Props) => {
  const [selected, setSelected] = useState('popular');

  return (
    <div className="paywall-overlay" onClick={onClose}>
      <div className="paywall-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="paywall-hero">🧾</div>
        <button className="paywall-close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
        <div className="paywall-body">
          <h2>¡Libérate de los tickets!</h2>
          <p>Escoge un plan a tu medida y automatiza tu facturación.</p>

          <div className="stat-row">
            <div className="big">+10,000</div>
            <div className="label">personas deduciendo impuestos con FacturaBot MX</div>
          </div>

          <div className="stars">★★★★★</div>
          <p className="quote">
            "He perdido tantas horas buscando y facturando mis tickets. Ahora lo
            hago fácil con solo una foto".
          </p>

          <div className="plans">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`plan-card ${selected === plan.id ? 'selected' : ''}`}
                onClick={() => setSelected(plan.id)}
              >
                {plan.popular && <span className="plan-badge">Más popular</span>}
                <span className="plan-radio">
                  {selected === plan.id && <span className="dot" />}
                </span>
                <div className="plan-price">${plan.price.toFixed(2)}</div>
                <div className="plan-desc">
                  {plan.ticketsPerMonth} tickets al mes y factura con {plan.rfcs}{' '}
                  RFC{plan.rfcs > 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>

          <button className="btn btn-primary" onClick={() => onSubscribe(selected)}>
            Prueba 7 días gratis
          </button>
          <button className="restore-link">Restaurar compras</button>
        </div>
      </div>
    </div>
  );
};

export default Paywall;
