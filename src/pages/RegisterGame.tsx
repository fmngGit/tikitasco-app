import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  fetchUsers, 
  fetchGames, 
  registerGame, 
  registerSession,
  editGame, 
  createGuestPlayer,
  sortUsersByName,
  initiateVideoUpload,
  uploadVideoToDrive,
  finalizeVideoUpload,
  type UserStats, 
  type SessionRound 
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Video, Plus, RefreshCw, Trophy, Trash2 } from 'lucide-react';

type Modality = 'standard' | 'reidapista' | 'rotacao_dinamica';

export const RegisterGame = () => {
  const { token, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const editGameId = searchParams.get('edit');

  const [users, setUsers] = useState<UserStats[]>([]);
  const [modality, setModality] = useState<Modality>('standard');
  const [gameDate, setGameDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Modo Padrão (2 Equipas)
  const [equipaA, setEquipaA] = useState<string[]>([]);
  const [equipaB, setEquipaB] = useState<string[]>([]);
  const [resA, setResA] = useState<number>(0);
  const [resB, setResB] = useState<number>(0);

  // Modo Rei da Pista (3 Equipas)
  const [reiEquipaA, setReiEquipaA] = useState<string[]>([]);
  const [reiEquipaB, setReiEquipaB] = useState<string[]>([]);
  const [reiEquipaC, setReiEquipaC] = useState<string[]>([]);
  const [reiMiniGames, setReiMiniGames] = useState<Array<{
    teamAKey: 'A' | 'B' | 'C';
    teamBKey: 'A' | 'B' | 'C';
    resA: number;
    resB: number;
  }>>([{ teamAKey: 'A', teamBKey: 'B', resA: 0, resB: 0 }]);

  // Modo Rotação Dinâmica (Períodos com Banco/Trocas)
  const [rotPool, setRotPool] = useState<string[]>([]); // Jogadores da sessão
  const [rotRounds, setRotRounds] = useState<Array<{
    equipaA: string[];
    equipaB: string[];
    banco: string[];
    resA: number;
    resB: number;
  }>>([]);

  // Estado do Vídeo
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);
  const [externalVideoUrl, setExternalVideoUrl] = useState<string>('');
  const [uploadedVideoData, setUploadedVideoData] = useState<{
    fileId?: string;
    downloadUrl?: string;
    expiryDate?: string;
  } | null>(null);

  // Convidado Rápido
  const [showAddGuest, setShowAddGuest] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [creatingGuest, setCreatingGuest] = useState(false);
  const [guestError, setGuestError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchUsers().then(data => {
      setUsers(data);

      // Verificar se veio do Gerador de Equipas
      const prefilled = (location.state as any)?.prefilledTeams;
      if (prefilled) {
        if (prefilled.teamCount === 3) {
          setModality('reidapista');
          setReiEquipaA(prefilled.equipaA || []);
          setReiEquipaB(prefilled.equipaB || []);
          setReiEquipaC(prefilled.equipaC || []);
        } else {
          setEquipaA(prefilled.equipaA || []);
          setEquipaB(prefilled.equipaB || []);
        }
      }
    });

    if (editGameId) {
      fetchGames().then(games => {
        const gameToEdit = games.find(g => g.GameID === editGameId);
        if (gameToEdit) {
          setResA(gameToEdit.Resultado_A);
          setResB(gameToEdit.Resultado_B);
          setEquipaA(gameToEdit.Equipa_A || []);
          setEquipaB(gameToEdit.Equipa_B || []);
          setGameDate(new Date(gameToEdit.Data).toISOString().split('T')[0]);
          if (gameToEdit.VideoDownloadUrl) {
            setUploadedVideoData({
              fileId: gameToEdit.VideoFileId,
              downloadUrl: gameToEdit.VideoDownloadUrl,
              expiryDate: gameToEdit.VideoExpiryDate
            });
          }
        }
      });
    }
  }, [editGameId, location.state]);

  // Alternar jogador no modo padrão
  const handlePlayerToggle = (email: string, team: 'A' | 'B') => {
    if (team === 'A') {
      if (equipaA.includes(email)) setEquipaA(prev => prev.filter(e => e !== email));
      else {
        setEquipaA(prev => [...prev, email]);
        setEquipaB(prev => prev.filter(e => e !== email));
      }
    } else {
      if (equipaB.includes(email)) setEquipaB(prev => prev.filter(e => e !== email));
      else {
        setEquipaB(prev => [...prev, email]);
        setEquipaA(prev => prev.filter(e => e !== email));
      }
    }
  };

  // Alternar jogador no modo Rei da Pista
  const handleReiPlayerToggle = (email: string, team: 'A' | 'B' | 'C') => {
    setReiEquipaA(prev => team === 'A' ? (prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]) : prev.filter(e => e !== email));
    setReiEquipaB(prev => team === 'B' ? (prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]) : prev.filter(e => e !== email));
    setReiEquipaC(prev => team === 'C' ? (prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]) : prev.filter(e => e !== email));
  };

  // Criar convidado rápido
  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    if (!token) {
      setGuestError('Sessão não detetada. Por favor faz login com a tua conta Google para adicionar convidados.');
      return;
    }

    setCreatingGuest(true);
    setGuestError(null);
    const res = await createGuestPlayer(token, guestName.trim());
    setCreatingGuest(false);

    if (res.success && res.user) {
      const newUser = res.user;
      setUsers(prev => sortUsersByName([...prev, newUser]));

      // Auto-selecionar o novo convidado na modalidade atual
      if (modality === 'standard') {
        if (equipaA.length <= equipaB.length) {
          setEquipaA(prev => [...prev, newUser.Email]);
        } else {
          setEquipaB(prev => [...prev, newUser.Email]);
        }
      } else if (modality === 'rotacao_dinamica') {
        setRotPool(prev => [...prev, newUser.Email]);
      }

      setGuestName('');
      setGuestError(null);
      setShowAddGuest(false);
    } else {
      const errMsg = res.error || 'Erro ao comunicar com a base de dados.';
      setGuestError(errMsg);
      if (errMsg.toLowerCase().includes('expired') || errMsg.toLowerCase().includes('token')) {
        setTimeout(() => logout(), 2500);
      }
    }
  };

  // Lógica do Rei da Pista: Adicionar próximo mini-jogo
  const addNextReiMiniGame = () => {
    const lastGame = reiMiniGames[reiMiniGames.length - 1];
    let winner: 'A' | 'B' | 'C' = lastGame.teamAKey;
    let outside: 'A' | 'B' | 'C' = 'C';

    const allKeys: Array<'A' | 'B' | 'C'> = ['A', 'B', 'C'];
    const participating = [lastGame.teamAKey, lastGame.teamBKey];
    outside = allKeys.find(k => !participating.includes(k)) || 'C';

    if (lastGame.resA > lastGame.resB) {
      winner = lastGame.teamAKey;
    } else if (lastGame.resB > lastGame.resA) {
      winner = lastGame.teamBKey;
    } else {
      // Empate: Por omissão o Rei (teamAKey) mantém-se
      winner = lastGame.teamAKey;
    }

    setReiMiniGames(prev => [
      ...prev,
      { teamAKey: winner, teamBKey: outside, resA: 0, resB: 0 }
    ]);
  };

  // Iniciar Rotação Dinâmica
  const startRotationMode = () => {
    if (rotPool.length < 4) {
      alert('Seleciona pelo menos 4 jogadores no pool da sessão.');
      return;
    }
    const half = Math.floor(rotPool.length / 2);
    const teamA = rotPool.slice(0, half);
    const teamB = rotPool.slice(half, half * 2);
    const bench = rotPool.slice(half * 2);

    setRotRounds([{
      equipaA: teamA,
      equipaB: teamB,
      banco: bench,
      resA: 0,
      resB: 0
    }]);
  };

  // Adicionar Ronda na Rotação Dinâmica
  const addNextRotationRound = () => {
    const last = rotRounds[rotRounds.length - 1];
    setRotRounds(prev => [
      ...prev,
      {
        equipaA: [...last.equipaA],
        equipaB: [...last.equipaB],
        banco: [...last.banco],
        resA: 0,
        resB: 0
      }
    ]);
  };

  // Trocar jogador de equipa/banco numa ronda específica
  const moveRotationPlayer = (roundIdx: number, email: string, target: 'A' | 'B' | 'banco') => {
    setRotRounds(prev => {
      const copy = [...prev];
      const round = { ...copy[roundIdx] };
      round.equipaA = round.equipaA.filter(e => e !== email);
      round.equipaB = round.equipaB.filter(e => e !== email);
      round.banco = round.banco.filter(e => e !== email);

      if (target === 'A') round.equipaA.push(email);
      else if (target === 'B') round.equipaB.push(email);
      else round.banco.push(email);

      copy[roundIdx] = round;
      return copy;
    });
  };

  // Upload direto de vídeo para a Google Drive
  const handleUploadVideo = async () => {
    if (!videoFile || !token) return;

    try {
      setVideoUploadProgress(1);
      setMessage(null);

      // 1. Pedir sessão de upload resumable ao backend Apps Script
      const initRes = await initiateVideoUpload(token, videoFile.name, videoFile.size, videoFile.type);
      if (!initRes.success || !initRes.uploadUrl) {
        throw new Error(initRes.error || 'Não foi possível iniciar o upload na Google Drive.');
      }

      // 2. Fazer o upload em streaming direto do browser/telemóvel para os servidores do Google
      const uploadRes = await uploadVideoToDrive(videoFile, initRes.uploadUrl, (pct) => {
        setVideoUploadProgress(pct);
      });

      if (!uploadRes.success) {
        throw new Error(uploadRes.error || 'Falha no envio do ficheiro de vídeo.');
      }

      // 3. Finalizar e obter permissões / data de expiração (+30 dias)
      if (uploadRes.fileId) {
        const finalRes = await finalizeVideoUpload(token, uploadRes.fileId);
        if (finalRes.success) {
          setUploadedVideoData({
            fileId: finalRes.fileId,
            downloadUrl: finalRes.downloadUrl,
            expiryDate: finalRes.expiryDate
          });
          setMessage({ type: 'success', text: 'Vídeo carregado com sucesso para a Google Drive! (Válido por 30 dias)' });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || err.toString() });
    } finally {
      setVideoUploadProgress(null);
    }
  };

  // Submissão do Formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setMessage(null);

    // Preparar dados do vídeo
    let finalVideoData = uploadedVideoData;
    if (!finalVideoData && externalVideoUrl.trim()) {
      finalVideoData = {
        downloadUrl: externalVideoUrl.trim(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    }

    // Se selecionou ficheiro mas não fez upload nem colou link, avisar o utilizador
    if (videoFile && !finalVideoData) {
      const proceed = window.confirm("Selecionaste um ficheiro de vídeo mas ainda não fizeste o upload para a Drive. Queres continuar e registar o jogo sem o vídeo?");
      if (!proceed) {
        setLoading(false);
        return;
      }
    }

    try {
      if (editGameId) {
        // Edição de jogo existente
        const res = await editGame(token, editGameId, gameDate, resA, resB, equipaA, equipaB, finalVideoData || undefined);
        if (res.success) {
          setMessage({ type: 'success', text: 'Jogo atualizado com sucesso!' });
          setTimeout(() => navigate('/history'), 1500);
        } else {
          setMessage({ type: 'error', text: res.error || 'Erro ao editar jogo.' });
        }
      } else if (modality === 'standard') {
        // Jogo Padrão
        if (equipaA.length === 0 || equipaB.length === 0) {
          setMessage({ type: 'error', text: 'Ambas as equipas precisam de ter jogadores.' });
          setLoading(false);
          return;
        }
        const res = await registerGame(token, gameDate, resA, resB, equipaA, equipaB, finalVideoData || undefined, undefined, 'standard');
        if (res.success) {
          setMessage({ type: 'success', text: 'Jogo registado com sucesso! Os pontos foram atualizados.' });
          setTimeout(() => navigate('/history'), 1500);
        } else {
          setMessage({ type: 'error', text: res.error || 'Erro ao registar jogo.' });
        }
      } else if (modality === 'reidapista') {
        // Rei da Pista
        const teamMap = { 'A': reiEquipaA, 'B': reiEquipaB, 'C': reiEquipaC };
        const rounds: SessionRound[] = reiMiniGames.map((g, idx) => ({
          resA: g.resA,
          resB: g.resB,
          equipaA: teamMap[g.teamAKey],
          equipaB: teamMap[g.teamBKey],
          roundNumber: idx + 1
        }));

        const res = await registerSession(token, {
          date: gameDate,
          sessionType: 'reidapista',
          rounds: rounds,
          videoFileId: finalVideoData?.fileId,
          videoDownloadUrl: finalVideoData?.downloadUrl,
          videoExpiryDate: finalVideoData?.expiryDate
        });

        if (res.success) {
          setMessage({ type: 'success', text: `Sessão Rei da Pista registada com ${rounds.length} mini-jogos!` });
          setTimeout(() => navigate('/history'), 1500);
        } else {
          setMessage({ type: 'error', text: res.error || 'Erro ao registar sessão.' });
        }
      } else if (modality === 'rotacao_dinamica') {
        // Rotação Dinâmica
        if (rotRounds.length === 0) {
          setMessage({ type: 'error', text: 'Adiciona pelo menos uma ronda à sessão.' });
          setLoading(false);
          return;
        }

        const rounds: SessionRound[] = rotRounds.map((r, idx) => ({
          resA: r.resA,
          resB: r.resB,
          equipaA: r.equipaA,
          equipaB: r.equipaB,
          roundNumber: idx + 1
        }));

        const res = await registerSession(token, {
          date: gameDate,
          sessionType: 'rotacao_dinamica',
          rounds: rounds,
          videoFileId: finalVideoData?.fileId,
          videoDownloadUrl: finalVideoData?.downloadUrl,
          videoExpiryDate: finalVideoData?.expiryDate
        });

        if (res.success) {
          setMessage({ type: 'success', text: `Sessão de Rotação Dinâmica registada com ${rounds.length} rondas!` });
          setTimeout(() => navigate('/history'), 1500);
        } else {
          setMessage({ type: 'error', text: res.error || 'Erro ao registar sessão.' });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.toString() });
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (email: string) => {
    const u = users.find(x => x.Email === email);
    return u ? u.Nome : email.split('@')[0];
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 1.5rem', maxWidth: '880px' }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.8rem' }}>
          {editGameId ? 'Editar Jogo' : 'Registar Jogo ou Sessão'}
        </h1>
      </div>

      {/* Seletor de Modalidade */}
      {!editGameId && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setModality('standard')}
            style={{
              flex: 1, minWidth: '160px', padding: '0.8rem', borderRadius: '10px',
              fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              background: modality === 'standard' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.04)',
              color: modality === 'standard' ? 'var(--primary)' : 'var(--text-muted)',
              border: `1px solid ${modality === 'standard' ? 'var(--primary)' : 'var(--border-color)'}`
            }}
          >
            ⚽ Jogo Padrão (2 Equipas)
          </button>
          <button
            type="button"
            onClick={() => setModality('reidapista')}
            style={{
              flex: 1, minWidth: '160px', padding: '0.8rem', borderRadius: '10px',
              fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              background: modality === 'reidapista' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.04)',
              color: modality === 'reidapista' ? 'var(--primary)' : 'var(--text-muted)',
              border: `1px solid ${modality === 'reidapista' ? 'var(--primary)' : 'var(--border-color)'}`
            }}
          >
            👑 Rei da Pista (3 Equipas)
          </button>
          <button
            type="button"
            onClick={() => setModality('rotacao_dinamica')}
            style={{
              flex: 1, minWidth: '160px', padding: '0.8rem', borderRadius: '10px',
              fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              background: modality === 'rotacao_dinamica' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.04)',
              color: modality === 'rotacao_dinamica' ? 'var(--primary)' : 'var(--text-muted)',
              border: `1px solid ${modality === 'rotacao_dinamica' ? 'var(--primary)' : 'var(--border-color)'}`
            }}
          >
            🔄 Rotação Dinâmica (Suplentes)
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          
          {/* Data do Jogo */}
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700 }}>Data da Partida / Sessão</label>
            <input 
              type="date" 
              value={gameDate} 
              onChange={e => setGameDate(e.target.value)} 
              required
              style={{ maxWidth: '240px', textAlign: 'center', fontSize: '1.1rem', margin: '0 auto' }}
            />
          </div>

          {/* ======================= MODALIDADE 1: PADRÃO ======================= */}
          {modality === 'standard' && (
            <>
              {/* Placar de Golos Centralizado e Compacto */}
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.75rem', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <label style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Equipa A
                  </label>
                  <input 
                    type="number" 
                    min="0" 
                    value={resA} 
                    onChange={e => setResA(Math.max(0, parseInt(e.target.value, 10) || 0))} 
                    className="score-input"
                    style={{ 
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '2px solid var(--primary)',
                      color: 'var(--text-main)',
                      boxShadow: '0 4px 15px rgba(245, 158, 11, 0.25)'
                    }} 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '1.4rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-muted)' }}>X</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                  <label style={{ fontWeight: 700, color: 'var(--danger)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Equipa B
                  </label>
                  <input 
                    type="number" 
                    min="0" 
                    value={resB} 
                    onChange={e => setResB(Math.max(0, parseInt(e.target.value, 10) || 0))} 
                    className="score-input"
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '2px solid var(--danger)',
                      color: 'var(--text-main)',
                      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.25)'
                    }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '1.5rem' }}>
                {/* Equipa A */}
                <div>
                  <h3 style={{ marginBottom: '1rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', color: 'var(--primary)' }}>
                    Equipa A ({equipaA.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '320px', overflowY: 'auto' }}>
                    {users.map(u => (
                      <label key={'A' + u.Email} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem',
                        background: equipaA.includes(u.Email) ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
                        borderRadius: '8px', cursor: 'pointer', border: equipaA.includes(u.Email) ? '1px solid var(--primary)' : '1px solid transparent'
                      }}>
                        <input type="checkbox" checked={equipaA.includes(u.Email)} onChange={() => handlePlayerToggle(u.Email, 'A')} style={{ width: 'auto' }} />
                        <span>{u.Nome} {u.IsGuest && '👻'}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Equipa B */}
                <div>
                  <h3 style={{ marginBottom: '1rem', borderBottom: '2px solid var(--danger)', paddingBottom: '0.5rem', color: 'var(--danger)' }}>
                    Equipa B ({equipaB.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '320px', overflowY: 'auto' }}>
                    {users.map(u => (
                      <label key={'B' + u.Email} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem',
                        background: equipaB.includes(u.Email) ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.03)',
                        borderRadius: '8px', cursor: 'pointer', border: equipaB.includes(u.Email) ? '1px solid var(--danger)' : '1px solid transparent'
                      }}>
                        <input type="checkbox" checked={equipaB.includes(u.Email)} onChange={() => handlePlayerToggle(u.Email, 'B')} style={{ width: 'auto' }} />
                        <span>{u.Nome} {u.IsGuest && '👻'}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botão Adicionar Convidado por baixo das equipas */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddGuest(true)}
                  className="btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px dashed rgba(245, 158, 11, 0.5)',
                    background: 'rgba(245, 158, 11, 0.06)'
                  }}
                >
                  <Plus size={16} style={{ color: 'var(--primary)' }} /> Adicionar Convidado à Lista
                </button>
              </div>
            </>
          )}

          {/* ======================= MODALIDADE 2: REI DA PISTA ======================= */}
          {modality === 'reidapista' && (
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                Forma 3 equipas. A equipa que ganha o mini-jogo mantém-se em campo como Rei, a que perde sai, e a que está de fora entra!
              </p>

              {/* Roster das 3 Equipas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                {(['A', 'B', 'C'] as const).map(teamKey => {
                  const teamColor = teamKey === 'A' ? 'var(--primary)' : teamKey === 'B' ? 'var(--danger)' : '#3b82f6';
                  const teamRoster = teamKey === 'A' ? reiEquipaA : teamKey === 'B' ? reiEquipaB : reiEquipaC;

                  return (
                    <div key={teamKey} style={{ background: 'rgba(0,0,0,0.25)', padding: '1rem', borderRadius: '10px', border: `1px solid ${teamColor}33` }}>
                      <h4 style={{ color: teamColor, marginBottom: '0.75rem' }}>Equipa {teamKey} ({teamRoster.length})</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '200px', overflowY: 'auto' }}>
                        {users.map(u => (
                          <label key={teamKey + u.Email} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={teamRoster.includes(u.Email)} 
                              onChange={() => handleReiPlayerToggle(u.Email, teamKey)} 
                              style={{ width: 'auto' }} 
                            />
                            {u.Nome} {u.IsGuest && '👻'}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botão Adicionar Convidado por baixo das 3 equipas */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddGuest(true)}
                  className="btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '8px',
                    border: '1px dashed rgba(245, 158, 11, 0.5)',
                    background: 'rgba(245, 158, 11, 0.06)'
                  }}
                >
                  <Plus size={16} style={{ color: 'var(--primary)' }} /> Adicionar Convidado à Lista
                </button>
              </div>

              {/* Mini-Jogos da Sessão */}
              <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trophy size={18} style={{ color: 'var(--primary)' }} /> Mini-Jogos Realizados ({reiMiniGames.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {reiMiniGames.map((mini, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(0,0,0,0.25)', padding: '0.85rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', gap: '1rem'
                  }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.9rem', minWidth: '32px' }}>#{idx + 1}</span>
                    
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 700, color: mini.teamAKey === 'A' ? 'var(--primary)' : mini.teamAKey === 'B' ? 'var(--danger)' : '#3b82f6', fontSize: '0.95rem' }}>
                        Equipa {mini.teamAKey}
                      </span>
                      <input 
                        type="number" min="0" value={mini.resA} 
                        onChange={e => {
                          const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                          setReiMiniGames(prev => {
                            const c = [...prev];
                            c[idx].resA = val;
                            return c;
                          });
                        }} 
                        className="score-input-sm"
                        style={{
                          border: `1.5px solid ${mini.teamAKey === 'A' ? 'rgba(245, 158, 11, 0.6)' : mini.teamAKey === 'B' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(59, 130, 246, 0.6)'}`,
                          background: 'rgba(255,255,255,0.06)',
                          color: '#fff'
                        }}
                      />
                    </div>

                    <span style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.9rem' }}>–</span>

                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '0.75rem' }}>
                      <input 
                        type="number" min="0" value={mini.resB} 
                        onChange={e => {
                          const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                          setReiMiniGames(prev => {
                            const c = [...prev];
                            c[idx].resB = val;
                            return c;
                          });
                        }} 
                        className="score-input-sm"
                        style={{
                          border: `1.5px solid ${mini.teamBKey === 'A' ? 'rgba(245, 158, 11, 0.6)' : mini.teamBKey === 'B' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(59, 130, 246, 0.6)'}`,
                          background: 'rgba(255,255,255,0.06)',
                          color: '#fff'
                        }}
                      />
                      <span style={{ fontWeight: 700, color: mini.teamBKey === 'A' ? 'var(--primary)' : mini.teamBKey === 'B' ? 'var(--danger)' : '#3b82f6', fontSize: '0.95rem' }}>
                        Equipa {mini.teamBKey}
                      </span>
                    </div>

                    {idx === reiMiniGames.length - 1 && idx > 0 ? (
                      <button 
                        type="button" 
                        onClick={() => setReiMiniGames(prev => prev.slice(0, -1))}
                        style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                        title="Remover este mini-jogo"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <div style={{ width: '24px' }} />
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addNextReiMiniGame}
                className="btn-secondary"
                style={{ width: '100%', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Plus size={16} /> Adicionar Próximo Mini-Jogo (Vencedor fica em campo)
              </button>
            </div>
          )}

          {/* ======================= MODALIDADE 3: ROTAÇÃO DINÂMICA ======================= */}
          {modality === 'rotacao_dinamica' && (
            <div>
              {rotRounds.length === 0 ? (
                <div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                    Seleciona todos os jogadores que vão rodar durante esta noite (ex: 12 jogadores para 5v5 com 2 a rodar).
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                    {users.map(u => (
                      <label key={u.Email} style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '6px',
                        background: rotPool.includes(u.Email) ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer', border: rotPool.includes(u.Email) ? '1px solid var(--primary)' : '1px solid var(--border-color)'
                      }}>
                        <input 
                          type="checkbox" 
                          checked={rotPool.includes(u.Email)} 
                          onChange={() => setRotPool(prev => prev.includes(u.Email) ? prev.filter(e => e !== u.Email) : [...prev, u.Email])} 
                          style={{ width: 'auto' }} 
                        />
                        <span style={{ fontSize: '0.85rem' }}>{u.Nome} {u.IsGuest && '👻'}</span>
                      </label>
                    ))}
                  </div>

                  {/* Ações por baixo do pool de jogadores */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddGuest(true)}
                      className="btn-secondary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.85rem',
                        padding: '0.65rem 1.2rem',
                        borderRadius: '8px',
                        border: '1px dashed rgba(245, 158, 11, 0.5)',
                        background: 'rgba(245, 158, 11, 0.06)'
                      }}
                    >
                      <Plus size={16} style={{ color: 'var(--primary)' }} /> Adicionar Convidado
                    </button>
                    <button type="button" onClick={startRotationMode} className="btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
                      Iniciar Sessão com {rotPool.length} Jogadores
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <RefreshCw size={18} style={{ color: 'var(--primary)' }} /> Rondas / Períodos Jogados ({rotRounds.length})
                    </h3>
                  </div>

                  {rotRounds.map((round, rIdx) => (
                    <div key={rIdx} style={{ background: 'rgba(0,0,0,0.25)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                        <h4 style={{ color: 'var(--primary)', margin: 0, fontSize: '1.05rem' }}>Ronda #{rIdx + 1}</h4>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>Equipa A</span>
                          <input 
                            type="number" min="0" value={round.resA} 
                            onChange={e => {
                              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setRotRounds(prev => {
                                const c = [...prev]; c[rIdx].resA = val; return c;
                              });
                            }} 
                            className="score-input-sm"
                            style={{
                              width: '52px',
                              height: '40px',
                              fontSize: '1.25rem',
                              border: '1.5px solid rgba(245, 158, 11, 0.5)',
                              background: 'rgba(245, 158, 11, 0.08)',
                              color: '#fff'
                            }}
                          />
                          <span style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0.15rem' }}>–</span>
                          <input 
                            type="number" min="0" value={round.resB} 
                            onChange={e => {
                              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setRotRounds(prev => {
                                const c = [...prev]; c[rIdx].resB = val; return c;
                              });
                            }} 
                            className="score-input-sm"
                            style={{
                              width: '52px',
                              height: '40px',
                              fontSize: '1.25rem',
                              border: '1.5px solid rgba(239, 68, 68, 0.5)',
                              background: 'rgba(239, 68, 68, 0.08)',
                              color: '#fff'
                            }}
                          />
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--danger)' }}>Equipa B</span>
                        </div>
                      </div>

                      {/* Lineup da Ronda com botões para trocar */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        {/* Equipa A */}
                        <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                          <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Equipa A ({round.equipaA.length})</div>
                          {round.equipaA.map(email => (
                            <div key={email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.2rem 0' }}>
                              <span>{getUserName(email)}</span>
                              <div style={{ display: 'flex', gap: '0.2rem' }}>
                                <button type="button" onClick={() => moveRotationPlayer(rIdx, email, 'B')} title="Passar para Equipa B" style={{ fontSize: '0.7rem', padding: '2px 4px', background: 'rgba(239,68,68,0.2)', borderRadius: '4px' }}>Para B</button>
                                <button type="button" onClick={() => moveRotationPlayer(rIdx, email, 'banco')} title="Passar para Banco" style={{ fontSize: '0.7rem', padding: '2px 4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>Banco</button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Equipa B */}
                        <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                          <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Equipa B ({round.equipaB.length})</div>
                          {round.equipaB.map(email => (
                            <div key={email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.2rem 0' }}>
                              <span>{getUserName(email)}</span>
                              <div style={{ display: 'flex', gap: '0.2rem' }}>
                                <button type="button" onClick={() => moveRotationPlayer(rIdx, email, 'A')} title="Passar para Equipa A" style={{ fontSize: '0.7rem', padding: '2px 4px', background: 'rgba(245,158,11,0.2)', borderRadius: '4px' }}>Para A</button>
                                <button type="button" onClick={() => moveRotationPlayer(rIdx, email, 'banco')} title="Passar para Banco" style={{ fontSize: '0.7rem', padding: '2px 4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>Banco</button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Banco / Fora */}
                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>No Banco ({round.banco.length})</div>
                          {round.banco.map(email => (
                            <div key={email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.2rem 0' }}>
                              <span style={{ color: 'var(--text-muted)' }}>{getUserName(email)}</span>
                              <div style={{ display: 'flex', gap: '0.2rem' }}>
                                <button type="button" onClick={() => moveRotationPlayer(rIdx, email, 'A')} style={{ fontSize: '0.7rem', padding: '2px 4px', background: 'rgba(245,158,11,0.2)', borderRadius: '4px' }}>Para A</button>
                                <button type="button" onClick={() => moveRotationPlayer(rIdx, email, 'B')} style={{ fontSize: '0.7rem', padding: '2px 4px', background: 'rgba(239,68,68,0.2)', borderRadius: '4px' }}>Para B</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                    <button
                      type="button"
                      onClick={addNextRotationRound}
                      className="btn-secondary"
                      style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <Plus size={16} /> Adicionar Próxima Ronda (Mantém equipas)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddGuest(true)}
                      className="btn-secondary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.85rem',
                        border: '1px dashed rgba(245, 158, 11, 0.5)',
                        background: 'rgba(245, 158, 11, 0.06)'
                      }}
                    >
                      <Plus size={15} style={{ color: 'var(--primary)' }} /> Novo Convidado
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================= SECÇÃO DE VÍDEO (GOOGLE DRIVE) ======================= */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '1.1rem' }}>
              <Video style={{ color: 'var(--primary)' }} size={20} /> Gravação de Vídeo do Jogo (Opcional)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              O vídeo será guardado na Google Drive durante <strong>30 dias</strong> para download de todos os colegas, expirando automaticamente a seguir para poupar espaço.
            </p>

            {uploadedVideoData ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)',
                padding: '1rem', borderRadius: '10px'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.9rem' }}>
                    🎬 Vídeo Anexado com Sucesso!
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Válido até: {new Date(uploadedVideoData.expiryDate || '').toLocaleDateString('pt-PT')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedVideoData(null)}
                  style={{ color: 'var(--danger)', fontSize: '0.85rem', textDecoration: 'underline' }}
                >
                  Remover Vídeo
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Upload Direto */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    1. Enviar ficheiro de vídeo diretamente do telemóvel/PC:
                  </label>
                  <input 
                    type="file" 
                    accept="video/*" 
                    onChange={e => setVideoFile(e.target.files?.[0] || null)}
                    style={{ marginBottom: '0.75rem' }}
                  />

                  {videoUploadProgress !== null && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span>A enviar para a Google Drive...</span>
                        <strong>{videoUploadProgress}%</strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${videoUploadProgress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.2s ease' }} />
                      </div>
                    </div>
                  )}

                  {videoFile && videoUploadProgress === null && (
                    <button
                      type="button"
                      onClick={handleUploadVideo}
                      className="btn-secondary"
                      style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                    >
                      Fazer Upload para a Drive Agora ({Math.round(videoFile.size / (1024 * 1024))} MB)
                    </button>
                  )}
                </div>

                {/* Ou Link Direto */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>OU cola um link da Drive/Cloud:</span>
                  <input 
                    type="url" 
                    placeholder="https://drive.google.com/file/d/..." 
                    value={externalVideoUrl} 
                    onChange={e => setExternalVideoUrl(e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
                  />
                </div>
              </div>
            )}
          </div>

          {message && (
            <div style={{ 
              padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', 
              background: message.type === 'success' ? 'rgba(0, 210, 106, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: message.type === 'success' ? 'var(--primary)' : 'var(--danger)',
              border: `1px solid ${message.type === 'success' ? 'var(--primary)' : 'var(--danger)'}`
            }}>
              {message.text}
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.05rem' }} disabled={loading}>
            {loading ? 'A Guardar...' : (editGameId ? 'Guardar Alterações' : 'Concluir e Registar Jogo')}
          </button>
        </div>
      </form>

      {/* Modal Adicionar Convidado Rápido */}
      {showAddGuest && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, backdropFilter: 'blur(4px)', padding: '1rem'
          }}
          onClick={() => { setShowAddGuest(false); setGuestError(null); }}
        >
          <div
            className="glass-panel animate-fade-in"
            style={{ width: '100%', maxWidth: '420px', padding: '2rem' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: '0.5rem' }}>Adicionar Convidado</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              O convidado será adicionado à lista e ficará disponível para jogar. Mais tarde pode reivindicar este perfil com a conta Google.
            </p>

            {guestError && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                background: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--danger)',
                fontSize: '0.85rem',
                border: '1px solid var(--danger)',
                lineHeight: 1.4
              }}>
                <strong>Erro:</strong> {guestError}
                {guestError.toLowerCase().includes('unknown action') && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    💡 É necessário atualizar o código no Google Apps Script para a versão mais recente do ficheiro <code>docs/backend.gs</code> e publicar uma <strong>Nova versão</strong>.
                  </div>
                )}
                {(guestError.toLowerCase().includes('token') || guestError.toLowerCase().includes('expired')) && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    A tua sessão Google expirou. A página vai reiniciar a sessão para poderes voltar a entrar.
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleCreateGuest}>
              <input
                type="text"
                placeholder="Nome do Convidado (ex: Pedro)"
                value={guestName}
                onChange={e => { setGuestName(e.target.value); setGuestError(null); }}
                required
                style={{ marginBottom: '1.25rem' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setShowAddGuest(false); setGuestError(null); }} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={creatingGuest}>
                  {creatingGuest ? 'A criar...' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
