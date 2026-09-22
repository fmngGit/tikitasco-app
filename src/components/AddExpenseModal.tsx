import React, { useState, useEffect } from 'react';
import { uploadReceiptToDrive, registerExpense, editExpense, fetchUsers, type UserStats, type Expense } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Receipt, Upload, Loader2, Plus, Trash2, FileImage } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  expense?: Expense | null; // Se fornecido, estamos em modo de Edição
}

interface Contribution {
  email: string;
  amount: string;
}

export const AddExpenseModal: React.FC<Props> = ({ onClose, onSuccess, expense }) => {
  const { token } = useAuth();
  
  const [description, setDescription] = useState(expense?.Descricao || '');
  const [amount, setAmount] = useState(expense?.Valor ? expense.Valor.toString() : '');
  
  // Extrair data do formato ISO se necessário, ou usar hoje
  const initDate = expense?.Data 
    ? new Date(expense.Data).toISOString().split('T')[0] 
    : new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(initDate);
  
  const [files, setFiles] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>(
    expense?.FotoUrl ? expense.FotoUrl.split(',').filter(u => u.trim() !== '') : []
  );
  
  const [users, setUsers] = useState<UserStats[]>([]);
  
  // Inicializar contribuições se existirem
  const initContribs = expense?.ContribuicoesDiretas 
    ? expense.ContribuicoesDiretas.map(c => ({ email: c.email, amount: c.amount.toString() }))
    : [];
  const [contributions, setContributions] = useState<Contribution[]>(initContribs);
  
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!expense;

  useEffect(() => {
    fetchUsers().then(setUsers);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const addContribution = () => {
    setContributions([...contributions, { email: '', amount: '' }]);
  };

  const updateContribution = (index: number, field: keyof Contribution, value: string) => {
    const newContribs = [...contributions];
    newContribs[index][field] = value;
    setContributions(newContribs);
  };

  const removeContribution = (index: number) => {
    setContributions(contributions.filter((_, i) => i !== index));
  };

  const totalAmount = parseFloat(amount) || 0;
  const totalContributions = contributions.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const boxAmount = Math.max(0, totalAmount - totalContributions);
  
  // Impede que as doações sejam superiores ao custo
  const isOverpaid = totalAmount > 0 && totalContributions > totalAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (totalAmount <= 0) {
      setError("O valor total tem de ser superior a zero.");
      return;
    }

    if (!description.trim()) {
      setError("Descrição é obrigatória.");
      return;
    }

    if (isOverpaid) {
      setError("As contribuições extra não podem ser superiores ao custo total da despesa.");
      return;
    }

    // Validar contribuições
    const validContribs = contributions.filter(c => c.email && parseFloat(c.amount) > 0);
    const hasEmptyContribs = contributions.some(c => (!c.email && c.amount) || (c.email && !parseFloat(c.amount)));
    if (hasEmptyContribs) {
      setError("Por favor, preenche todos os campos das contribuições em aberto ou remove-as.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Manter fotos antigas que não foram apagadas e adicionamos novas separadas por vírgula
      let photoUrls: string[] = [...existingPhotos];
      
      // Upload Faturas/Fotos se existirem
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setLoadingStatus(`A carregar anexo ${i + 1} de ${files.length}...`);
          
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
          });
          
          const uploadRes = await uploadReceiptToDrive(token, base64, file.name);
          if (uploadRes.success && uploadRes.fileUrl) {
            photoUrls.push(uploadRes.fileUrl);
          } else {
            throw new Error(uploadRes.error || `Erro ao fazer upload do ficheiro ${file.name}.`);
          }
        }
      }

      setLoadingStatus('A guardar dados na base de dados...');
      const photoUrlStr = photoUrls.join(',');

      // Preparar payload de contribuições
      const formattedContribs = validContribs.map(c => ({
        email: c.email,
        amount: parseFloat(c.amount)
      }));

      // Registar ou Editar Despesa
      let res;
      if (isEditMode && expense) {
        res = await editExpense(
          token,
          expense.ExpenseID,
          date,
          description,
          totalAmount,
          photoUrlStr,
          boxAmount,
          formattedContribs
        );
      } else {
        res = await registerExpense(
          token, 
          date, 
          description, 
          totalAmount, 
          photoUrlStr,
          boxAmount,
          formattedContribs
        );
      }
      
      if (res.success) {
        setLoadingStatus('Concluído!');
        onSuccess();
      } else {
        throw new Error(res.error || "Erro ao guardar despesa.");
      }
    } catch (err: any) {
      setError(err.message || err.toString());
      setLoading(false);
      setLoadingStatus('');
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1rem'
    }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          disabled={loading}
        >
          <X size={24} />
        </button>

        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Receipt size={22} style={{ color: 'var(--primary)' }} /> 
          {isEditMode ? 'Editar Despesa' : 'Registar Despesa'}
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
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Custo Total da Compra (€)</label>
            <input 
              type="number" 
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              required
              style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem', fontWeight: 700 }}
            />
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Contribuições Extra (Bolsos Próprios)</label>
              <button type="button" onClick={addContribution} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                <Plus size={14} /> Adicionar
              </button>
            </div>
            
            {contributions.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                Ninguém deu dinheiro extra do próprio bolso.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {contributions.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                    <select 
                      value={c.email} 
                      onChange={e => updateContribution(i, 'email', e.target.value)}
                      style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                    >
                      <option value="" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>-- Selecionar Jogador --</option>
                      {users.map(u => (
                        <option key={u.Email} value={u.Email} style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>{u.Nome}</option>
                      ))}
                    </select>
                    <input 
                      type="number" 
                      placeholder="€" 
                      step="0.01" 
                      min="0.01"
                      value={c.amount}
                      onChange={e => updateContribution(i, 'amount', e.target.value)}
                      style={{ width: '80px', padding: '0.5rem', fontSize: '0.85rem' }}
                    />
                    <button type="button" onClick={() => removeContribution(i)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0 0.25rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ 
            background: isOverpaid ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
            border: `1px dashed ${isOverpaid ? 'var(--danger)' : 'rgba(245, 158, 11, 0.4)'}`, 
            padding: '1rem', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.85rem', color: isOverpaid ? 'var(--danger)' : 'var(--primary)', marginBottom: '0.25rem' }}>
              Valor a retirar da Caixinha
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: isOverpaid ? 'var(--danger)' : 'var(--text-main)' }}>
              {isOverpaid ? 'Aviso: Doações excedem custo' : `${boxAmount.toFixed(2)}€`}
            </div>
            {totalContributions > 0 && !isOverpaid && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                ({totalAmount.toFixed(2)}€ custo - {totalContributions.toFixed(2)}€ doações)
              </div>
            )}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <Upload size={24} style={{ color: files.length > 0 ? 'var(--primary)' : 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.85rem', color: files.length > 0 ? 'var(--primary)' : 'var(--text-muted)', fontWeight: files.length > 0 ? 700 : 400, textAlign: 'center' }}>
                {files.length > 0 
                  ? `${files.length} ficheiro(s) selecionado(s)` 
                  : "Anexar Faturas / Fotos (Opcional)"}
              </span>
              <input type="file" multiple accept="image/*,application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
            
            {/* Mostrar anexos já existentes em modo edição */}
            {isEditMode && existingPhotos.length > 0 && (
              <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Anexos guardados:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {existingPhotos.map((url, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                        <FileImage size={14} style={{ color: 'var(--primary)' }} />
                        <span>Anexo {idx + 1}</span>
                        <a href={url.trim()} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline', marginLeft: '0.5rem' }}>Ver</a>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setExistingPhotos(existingPhotos.filter((_, i) => i !== idx))}
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.25rem' }}
                        title="Remover anexo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} disabled={loading || isOverpaid}>
              {loading && <Loader2 size={16} className="spin" />}
              {loading ? loadingStatus || 'A guardar...' : (isEditMode ? 'Guardar Alterações' : 'Registar Despesa')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
