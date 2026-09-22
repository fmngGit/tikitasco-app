import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { registerLocation, editLocation, uploadReceiptToDrive, type Location } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Upload, MapPin, Loader, FileImage, Trash2, Map } from 'lucide-react';
import { MapPicker } from './MapPicker';

interface AddLocationModalProps {
  location?: Location | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddLocationModal: React.FC<AddLocationModalProps> = ({ location, onClose, onSuccess }) => {
  const { token } = useAuth();
  const isEditMode = !!location;

  const [nome, setNome] = useState(location?.Nome || '');
  const [morada, setMorada] = useState(location?.Morada || '');
  const [showMap, setShowMap] = useState(false);
  const [precoHora, setPrecoHora] = useState<number | ''>(location?.PrecoHora || '');
  
  const [hasExtraBola, setHasExtraBola] = useState(location?.PrecoBola !== undefined);
  const [precoBola, setPrecoBola] = useState<number | ''>(location?.PrecoBola !== undefined ? location.PrecoBola : '');
  
  const [hasExtraColetes, setHasExtraColetes] = useState(location?.PrecoColetes !== undefined);
  const [precoColetes, setPrecoColetes] = useState<number | ''>(location?.PrecoColetes !== undefined ? location.PrecoColetes : '');

  const [tipoPiso, setTipoPiso] = useState(location?.TipoPiso || '');
  const [indoor, setIndoor] = useState<boolean>(location?.Indoor === 1);
  const [balnearios, setBalnearios] = useState<boolean>(location?.Balnearios === 1);
  const [tipoFutebol, setTipoFutebol] = useState(location?.TipoFutebol || '');
  
  const [telefone, setTelefone] = useState(location?.Telefone || '');
  const [email, setEmail] = useState(location?.Email || '');
  const [notas, setNotas] = useState(location?.Notas || '');

  const [files, setFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>(
    location?.FotosUrl ? location.FotosUrl.split(',').filter(u => u.trim() !== '') : []
  );

  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const uploadFiles = async (): Promise<string[]> => {
    let uploadedUrls: string[] = [];
    const GAS_URL = import.meta.env.VITE_GAS_URL;
    
    if (!GAS_URL || GAS_URL.includes("COLA_AQUI")) {
      return files.map(f => `mock-url-${f.name}`);
    }

    for (let i = 0; i < files.length; i++) {
      setLoadingText(`A carregar anexo ${i + 1} de ${files.length}...`);
      const file = files[i];
      const base64 = await toBase64(file);
      
      const uploadRes = await uploadReceiptToDrive(token || '', base64, file.name);
      if (uploadRes.success && uploadRes.fileUrl) {
        uploadedUrls.push(uploadRes.fileUrl);
      } else {
        throw new Error(uploadRes.error || `Erro ao fazer upload da foto ${i + 1}`);
      }
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!nome.trim()) return setError("Nome é obrigatório.");
    if (precoHora === '') return setError("Preço por hora é obrigatório.");
    if (!tipoPiso) return setError("Tipo de Piso é obrigatório.");

    setLoading(true);
    setError(null);

    try {
      let photoUrls: string[] = [...existingPhotos];

      if (files.length > 0) {
        const newUrls = await uploadFiles();
        photoUrls = [...photoUrls, ...newUrls];
      }

      setLoadingText('A guardar dados do campo...');

      const finalPrecoBola = hasExtraBola && precoBola !== '' ? Number(precoBola) : undefined;
      const finalPrecoColetes = hasExtraColetes && precoColetes !== '' ? Number(precoColetes) : undefined;

      let res;
      if (isEditMode && location) {
        res = await editLocation(
          token, 
          location.LocationID, 
          nome, 
          morada, 
          Number(precoHora), 
          finalPrecoBola, 
          finalPrecoColetes, 
          tipoPiso, 
          indoor, 
          balnearios, 
          tipoFutebol, 
          photoUrls.join(','),
          telefone,
          email,
          notas
        );
      } else {
        res = await registerLocation(
          token, 
          nome, 
          morada, 
          Number(precoHora), 
          finalPrecoBola, 
          finalPrecoColetes, 
          tipoPiso, 
          indoor, 
          balnearios, 
          tipoFutebol, 
          photoUrls.join(','),
          telefone,
          email,
          notas
        );
      }

      setLoading(false);
      
      if (res.success) {
        onSuccess();
      } else {
        setError(res.error || 'Erro ao guardar local.');
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.toString());
    }
  };

  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, backdropFilter: 'blur(8px)', padding: '1rem', overflowY: 'auto'
    }} onClick={onClose}>
      
      <div className="glass-panel animate-fade-in" style={{
        width: '100%', maxWidth: '600px', background: 'var(--bg-card)', 
        borderRadius: '16px', padding: '2rem', position: 'relative',
        maxHeight: '90vh', overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} style={{
          position: 'absolute', top: '1.25rem', right: '1.25rem',
          background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '50%',
          width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
        }}>
          <X size={18} />
        </button>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin style={{ color: 'var(--primary)' }} />
          {isEditMode ? 'Editar Campo' : 'Novo Campo'}
        </h2>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--danger)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Nome do Campo *</label>
            <input 
              type="text" 
              value={nome} 
              onChange={e => setNome(e.target.value)} 
              placeholder="Ex: Pavilhão da Escola, Ringue Municipal"
              required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} 
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Morada / Localidade</label>
              <button 
                type="button" 
                onClick={() => setShowMap(!showMap)}
                style={{ 
                  background: showMap ? 'var(--primary)' : 'rgba(255,255,255,0.05)', 
                  color: showMap ? '#fff' : 'var(--text-main)', 
                  border: showMap ? 'none' : '1px solid var(--border-color)', 
                  padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', 
                  display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <Map size={14} /> 
                {showMap ? 'Fechar Mapa' : '📍 Escolher no Mapa'}
              </button>
            </div>
            
            {showMap && (
              <div style={{ marginBottom: '1rem', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textAlign: 'center' }}>
                  Clica no mapa para definir a localização exata do campo.
                </div>
                <MapPicker 
                  onLocationSelect={(lat, lng) => {
                    setMorada(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                  }} 
                />
              </div>
            )}

            <input 
              type="text" 
              value={morada} 
              onChange={e => setMorada(e.target.value)} 
              placeholder="Ex: Rua Direita, 123 (ou clica no botão acima)"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Preço Base (€/Hora) *</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={precoHora} 
                onChange={e => setPrecoHora(e.target.value !== '' ? Number(e.target.value) : '')} 
                required 
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} 
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Tipo de Futebol</label>
              <select 
                value={tipoFutebol} 
                onChange={e => setTipoFutebol(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} 
              >
                <option value="" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>Selecione...</option>
                <option value="5v5" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>5 para 5</option>
                <option value="7v7" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>7 para 7</option>
                <option value="11v11" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>11 para 11</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={hasExtraBola} onChange={e => setHasExtraBola(e.target.checked)} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Custo Extra: Bola</span>
              </label>
              {hasExtraBola && (
                <input 
                  type="number" step="0.01" min="0" placeholder="€ Bola"
                  value={precoBola} onChange={e => setPrecoBola(e.target.value !== '' ? Number(e.target.value) : '')} 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} 
                />
              )}
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={hasExtraColetes} onChange={e => setHasExtraColetes(e.target.checked)} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Custo Extra: Coletes</span>
              </label>
              {hasExtraColetes && (
                <input 
                  type="number" step="0.01" min="0" placeholder="€ Coletes"
                  value={precoColetes} onChange={e => setPrecoColetes(e.target.value !== '' ? Number(e.target.value) : '')} 
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} 
                />
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Tipo de Piso *</label>
            <select 
              value={tipoPiso} 
              onChange={e => setTipoPiso(e.target.value)} 
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} 
            >
              <option value="" disabled style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>Selecione um tipo...</option>
              <option value="Sintético Alto (Relvado)" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>Sintético Alto (Relvado)</option>
              <option value="Sintético Curto (Alcatifa)" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>Sintético Curto (Alcatifa)</option>
              <option value="Piso Modular (Borracha/Plástico)" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>Piso Modular (Borracha/Plástico)</option>
              <option value="Madeira (Taco)" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>Madeira (Taco)</option>
              <option value="Cimento" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>Cimento</option>
              <option value="Alcatrão" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>Alcatrão</option>
              <option value="Relva Natural" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>Relva Natural</option>
              <option value="Terra Batida" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>Terra Batida</option>
              <option value="Outro" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>Outro</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={indoor} onChange={e => setIndoor(e.target.checked)} />
              <span style={{ fontWeight: 600 }}>Coberto (Indoor)</span>
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={balnearios} onChange={e => setBalnearios(e.target.checked)} />
              <span style={{ fontWeight: 600 }}>Tem Balneários</span>
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Telefone</label>
              <input 
                type="tel" 
                value={telefone} 
                onChange={e => setTelefone(e.target.value)} 
                placeholder="Ex: 912345678"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} 
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="Ex: campo@mail.com"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }} 
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Notas Extra</label>
            <textarea 
              value={notas} 
              onChange={e => setNotas(e.target.value)} 
              placeholder="Ex: Pedir chaves no café ao lado"
              rows={2}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', color: 'var(--text-main)', resize: 'vertical' }} 
            />
          </div>

          <div style={{ padding: '1.5rem', border: '2px dashed var(--border-color)', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <Upload size={24} style={{ color: files.length > 0 ? 'var(--primary)' : 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.85rem', color: files.length > 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: files.length > 0 ? 700 : 400, textAlign: 'center' }}>
                {files.length > 0 ? `${files.length} foto(s) selecionada(s)` : "Anexar Fotos do Campo (Opcional)"}
              </span>
              <input type="file" multiple accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>

            {isEditMode && existingPhotos.length > 0 && (
              <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Fotos guardadas:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {existingPhotos.map((url, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                        <FileImage size={14} style={{ color: 'var(--primary)' }} />
                        <span>Foto {idx + 1}</span>
                        <a href={url.trim()} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline', marginLeft: '0.5rem' }}>Ver</a>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setExistingPhotos(existingPhotos.filter((_, i) => i !== idx))}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
                        title="Remover foto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} disabled={loading}>
              {loading ? (
                <>
                  <Loader size={18} className="spin" /> 
                  <span style={{ fontSize: '0.85rem' }}>{loadingText || 'A guardar...'}</span>
                </>
              ) : 'Guardar Campo'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
