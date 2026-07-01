interface Props {
  onShowPaywall: () => void;
}

const CuentaScreen = ({ onShowPaywall }: Props) => {
  return (
    <div className="screen">
      <h1>Cuenta</h1>

      <div className="account-row">
        <span className="label">Plan actual</span>
        <span className="value">Gratis</span>
      </div>
      <div className="account-row">
        <span className="label">Tickets este mes</span>
        <span className="value">0 / 3</span>
      </div>
      <div className="account-row">
        <span className="label">RFCs registrados</span>
        <span className="value">0</span>
      </div>

      <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={onShowPaywall}>
        Ver planes
      </button>
    </div>
  );
};

export default CuentaScreen;
