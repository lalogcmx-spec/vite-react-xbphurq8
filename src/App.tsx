import { useState } from 'react';
import './App.css';
import FacturasScreen from './components/FacturasScreen';
import SubirTicketScreen from './components/SubirTicketScreen';
import CuentaScreen from './components/CuentaScreen';
import Paywall from './components/Paywall';
import { Ticket } from './types';

type Tab = 'facturas' | 'subir' | 'cuenta';

const App = () => {
  const [tab, setTab] = useState<Tab>('facturas');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);

  const handleUploaded = () => {
    setTickets((prev) => [
      {
        id: crypto.randomUUID(),
        comercio: null,
        total: null,
        fecha: new Date().toLocaleDateString('es-MX'),
        status: 'recibido',
        xml_url: null,
        pdf_url: null,
        error_message: null,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    setTab('facturas');
  };

  return (
    <div className="app-shell">
      {tab === 'facturas' && (
        <FacturasScreen tickets={tickets} onUploadClick={() => setTab('subir')} />
      )}
      {tab === 'subir' && <SubirTicketScreen onUploaded={handleUploaded} />}
      {tab === 'cuenta' && <CuentaScreen onShowPaywall={() => setShowPaywall(true)} />}

      <nav className="bottom-nav">
        <button
          className={`nav-item ${tab === 'facturas' ? 'active' : ''}`}
          onClick={() => setTab('facturas')}
        >
          <span className="nav-icon">📄</span>
          Facturas
        </button>
        <button
          className={`nav-item center ${tab === 'subir' ? 'active' : ''}`}
          onClick={() => setTab('subir')}
        >
          <span className="nav-icon">+</span>
          Subir ticket
        </button>
        <button
          className={`nav-item ${tab === 'cuenta' ? 'active' : ''}`}
          onClick={() => setTab('cuenta')}
        >
          <span className="nav-icon">👤</span>
          Cuenta
        </button>
      </nav>

      {showPaywall && (
        <Paywall
          onClose={() => setShowPaywall(false)}
          onSubscribe={() => setShowPaywall(false)}
        />
      )}
    </div>
  );
};

export default App;
