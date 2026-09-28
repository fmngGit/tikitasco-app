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
  fetchLocations,
  type UserStats, 
  type SessionRound,
  type Location
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Video } from 'lucide-react';
import { StandardGameForm } from '../components/game-forms/StandardGameForm';
import { KingOfTheCourtForm } from '../components/game-forms/KingOfTheCourtForm';
import { RotationGameForm } from '../components/game-forms/RotationGameForm';

type Modality = 'standard' | 'reidapista' | 'rotacao_dinamica';

export const RegisterGame = () => {
  const { token, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const editGameId = searchParams.get('edit');

  const [users, setUsers] = useState<UserStats[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [modality, setModality] = useState<Modality>('standard');
  const [gameDate, setGameDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [locationId, setLocationId] = useState<string>('');

  // Modo Padrão (2 Equipas)
  const [equipaA, setEquipaA] = useState<string[]>([]);
  const [equipaB, setEquipaB] = useState<string[]>([]);
  const [resA, setResA] = useState<number>(0);
  const [resB, setResB] = useState<number>(0);
  const [fieldCost, setFieldCost] = useState<number>(0);
  const [playerFee, setPlayerFee] = useState<number>(0);

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

    fetchLocations().then(data => setLocations(data));

    if (editGameId) {
      fetchGames().then(games => {
        const gameToEdit = games.find(g => g.GameID === editGameId);
        if (gameToEdit) {
          setResA(gameToEdit.Resultado_A);
          setResB(gameToEdit.Resultado_B);
          setEquipaA(gameToEdit.Equipa_A || []);
          setEquipaB(gameToEdit.Equipa_B || []);
          setGameDate(new Date(gameToEdit.Data).toISOString().split('T')[0]);
          setFieldCost(gameToEdit.FieldCost || 0);
          setPlayerFee(gameToEdit.Fee || 0);
          if (gameToEdit.VideoDownloadUrl) {
            setUploadedVideoData({
              fileId: gameToEdit.VideoFileId,
              downloadUrl: gameToEdit.VideoDownloadUrl,
              expiryDate: gameToEdit.VideoExpiryDate
            });
          }
          if (gameToEdit.LocationID) {
            setLocationId(gameToEdit.LocationID);
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
        const res = await editGame(token, editGameId, gameDate, resA, resB, equipaA, equipaB, finalVideoData || undefined, locationId || undefined);
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
        const res = await registerGame(token, gameDate, resA, resB, equipaA, equipaB, finalVideoData || undefined, undefined, 'standard', 1, fieldCost, playerFee, locationId || undefined);
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
          videoExpiryDate: finalVideoData?.expiryDate,
          locationId: locationId || undefined
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
          videoExpiryDate: finalVideoData?.expiryDate,
          locationId: locationId || undefined
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

  const numPlayers = modality === 'standard' ? equipaA.length + equipaB.length 
                   : modality === 'reidapista' ? reiEquipaA.length + reiEquipaB.length + reiEquipaC.length
                   : rotPool.length;
                   
  const costPerPlayer = numPlayers > 0 ? (fieldCost / numPlayers) + playerFee : 0;

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
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Data da Sessão</label>
                <input type="date" value={gameDate} onChange={(e) => setGameDate(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }} />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Campo (Opcional)</label>
                <select
                  value={locationId}
                  onChange={e => setLocationId(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                >
                  <option value="">Nenhum campo selecionado</option>
                  {locations.map(loc => (
                    <option key={loc.LocationID} value={loc.LocationID}>
                      {loc.Nome} ({loc.PrecoHora.toFixed(2)}€/h)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Custos e Tesouraria */}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
              💰 Custos e Tesouraria
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Custo do Campo (Total €)</label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  value={fieldCost || ''} 
                  onChange={e => setFieldCost(Math.max(0, parseFloat(e.target.value) || 0))} 
                  style={{ width: '100%', padding: '0.75rem' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Taxa para Caixinha (Por Jogador €)</label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01"
                  value={playerFee || ''} 
                  onChange={e => setPlayerFee(Math.max(0, parseFloat(e.target.value) || 0))} 
                  style={{ width: '100%', padding: '0.75rem' }}
                />
              </div>
            </div>

            <div style={{ 
              background: 'rgba(245, 158, 11, 0.1)', 
              border: '1px dashed rgba(245, 158, 11, 0.4)', 
              padding: '1rem', 
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>Total a pagar por jogador ({numPlayers} jogadores)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {costPerPlayer.toFixed(2)}€
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                ({fieldCost > 0 && numPlayers > 0 ? (fieldCost/numPlayers).toFixed(2) : '0.00'}€ p/ campo + {playerFee.toFixed(2)}€ p/ caixinha)
              </div>
            </div>
          </div>

          {/* ======================= MODALIDADE 1: PADRÃO ======================= */}
          {modality === 'standard' && (
            <StandardGameForm
              users={users}
              equipaA={equipaA}
              equipaB={equipaB}
              resA={resA}
              resB={resB}
              setResA={setResA}
              setResB={setResB}
              handlePlayerToggle={handlePlayerToggle}
              setShowAddGuest={setShowAddGuest}
            />
          )}

          {/* ======================= MODALIDADE 2: REI DA PISTA ======================= */}
          {modality === 'reidapista' && (
            <KingOfTheCourtForm
              users={users}
              reiEquipaA={reiEquipaA}
              reiEquipaB={reiEquipaB}
              reiEquipaC={reiEquipaC}
              handleReiPlayerToggle={handleReiPlayerToggle}
              reiMiniGames={reiMiniGames}
              setReiMiniGames={setReiMiniGames}
              setShowAddGuest={setShowAddGuest}
              addNextReiMiniGame={addNextReiMiniGame}
            />
          )}

          {/* ======================= MODALIDADE 3: ROTAÇÃO DINÂMICA ======================= */}
          {modality === 'rotacao_dinamica' && (
            <RotationGameForm
              users={users}
              rotPool={rotPool}
              setRotPool={setRotPool}
              rotRounds={rotRounds}
              setRotRounds={setRotRounds}
              startRotationMode={startRotationMode}
              addNextRotationRound={addNextRotationRound}
              moveRotationPlayer={moveRotationPlayer}
              setShowAddGuest={setShowAddGuest}
              getUserName={getUserName}
            />
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
