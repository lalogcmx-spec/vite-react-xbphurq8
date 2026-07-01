import { useRef, useState } from 'react';

interface Props {
  onUploaded: () => void;
}

const SubirTicketScreen = ({ onUploaded }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');

  const handleFile = (selected: File | null) => {
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setStatus('idle');
  };

  const handleSubmit = async () => {
    if (!file) return;
    setStatus('uploading');
    try {
      const form = new FormData();
      form.append('ticket', file);
      const res = await fetch('/api/tickets/upload', { method: 'POST', body: form });
      if (!res.ok) throw new Error('upload failed');
      setStatus('done');
      onUploaded();
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="screen">
      <h1>Subir ticket</h1>

      {!preview ? (
        <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
          <span className="emoji">📷</span>
          <h3>Toma foto de tu ticket</h3>
          <p>O selecciona una imagen desde tu galería</p>
        </div>
      ) : (
        <img className="preview-img" src={preview} alt="Vista previa del ticket" />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      <div className="step-card">
        <span className="step-num">1</span>
        <div className="step-text">
          <h3>Toma foto de tu ticket</h3>
          <p>Da click en el botón de Subir Ticket</p>
        </div>
        <span className="step-icon">📷</span>
      </div>
      <div className="step-card">
        <span className="step-num">2</span>
        <div className="step-text">
          <h3>Procesaremos tu factura</h3>
          <p>Nuestro equipo de IA facturará tu ticket automáticamente</p>
        </div>
        <span className="step-icon">📨</span>
      </div>
      <div className="step-card">
        <span className="step-num">3</span>
        <div className="step-text">
          <h3>¡Recibe tu factura!</h3>
          <p>Sin esfuerzo y al instante por WhatsApp y correo</p>
        </div>
        <span className="step-icon">📄</span>
      </div>

      {preview && (
        <button
          className="btn btn-primary"
          style={{ marginTop: 12 }}
          onClick={handleSubmit}
          disabled={status === 'uploading'}
        >
          {status === 'uploading' ? 'Subiendo…' : 'Enviar ticket'}
        </button>
      )}
      {status === 'error' && (
        <p style={{ color: '#c62828', marginTop: 12, fontSize: 13 }}>
          No se pudo subir el ticket. Intenta de nuevo.
        </p>
      )}
    </div>
  );
};

export default SubirTicketScreen;
