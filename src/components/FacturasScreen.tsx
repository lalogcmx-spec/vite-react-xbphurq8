import { Ticket } from '../types';

const STATUS_LABEL: Record<string, string> = {
  recibido: 'Recibido',
  esperando_confirmacion: 'Esperando datos',
  en_cola_facturacion: 'Facturando…',
  facturado: 'Facturado',
  error: 'Error',
};

const STATUS_ICON: Record<string, string> = {
  recibido: '🧾',
  esperando_confirmacion: '✏️',
  en_cola_facturacion: '⏳',
  facturado: '✅',
  error: '⚠️',
};

interface Props {
  tickets: Ticket[];
  onUploadClick: () => void;
}

const FacturasScreen = ({ tickets, onUploadClick }: Props) => {
  return (
    <div className="screen">
      <h1>Facturas</h1>

      <div className="banner">
        <div className="banner-title">⚠️ Alta demanda</div>
        <p>Recuerda que algunos comercios no facturan a tiempo los tickets en fin de mes.</p>
      </div>

      <div className="promo-card">
        <div>
          <h2>¡Libérate de los tickets!</h2>
          <p>Prueba gratis 7 días.</p>
          <button className="btn btn-light" onClick={onUploadClick}>
            + Subir ticket
          </button>
        </div>
        <span className="emoji">🎉</span>
      </div>

      {tickets.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🧾</span>
          Aún no has subido tickets. Toca "Subir ticket" para empezar.
        </div>
      ) : (
        tickets.map((t) => (
          <div className="factura-row" key={t.id}>
            <span className={`icon ${t.status}`}>{STATUS_ICON[t.status]}</span>
            <div className="factura-info">
              <div className="comercio">{t.comercio ?? 'Comercio sin identificar'}</div>
              <div className="meta">
                {t.fecha ?? '—'} {t.total ? `· $${t.total.toFixed(2)}` : ''}
              </div>
            </div>
            <span className={`status-pill ${t.status}`}>{STATUS_LABEL[t.status]}</span>
          </div>
        ))
      )}
    </div>
  );
};

export default FacturasScreen;
