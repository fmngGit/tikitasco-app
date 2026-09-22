import React, { useState } from 'react';
import { uploadReceiptToDrive, registerExpense } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Receipt, Upload, Loader2 } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export const AddExpenseModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const { token } = useAuth();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Valor inválido.");
      return;
    }

    if (!description.trim()) {
      setError("Descrição é obrigatória.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let photoUrl = '';
      
      // Upload Fatura se existir
      if (file) {
        // Converter ficheiro para base64 para envio simplificado
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
        
        const uploadRes = await uploadReceiptToDrive(token, base64, file.name);
        if (uploadRes.success && uploadRes.fileUrl) {
          photoUrl = uploadRes.fileUrl;
        } else {
          throw new Error(uploadRes.error || "Erro ao fazer upload da fatura/foto.");
        }
      }

      // Registar Despesa
      const res = await registerExpense(token, date, description, amountNum, photoUrl);
      if (res.success) {
        onSuccess();
      } else {
        throw new Error(res.error || "Erro ao registar despesa.");
      }
    } catch (err: any) {
      setError(err.message || err.toString());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1rem'
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '2rem', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>

        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Receipt size={22} style={{ color: 'var(--primary)' }} /> Registar Despesa
        </h3>

        {error && (
          <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Data da Despesa</label>
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
              required
              style={{ width: '100%', padding: '0.75rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Descrição</label>
            <input 
              type="text" 
              placeholder="Ex: Compra de 2 bolas e coletes"
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              required
              style={{ width: '100%', padding: '0.75rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Valor Total (€)</label>
            <input 
              type="number" 
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              required
              style={{ width: '100%', padding: '0.75rem' }}
            />
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <Upload size={24} style={{ color: file ? 'var(--primary)' : 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.85rem', color: file ? 'var(--primary)' : 'var(--text-muted)', fontWeight: file ? 700 : 400, textAlign: 'center' }}>
                {file ? file.name : "Anexar Fatura / Foto (Opcional mas recomendado)"}
              </span>
              <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }} disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : 'Registar Despesa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
