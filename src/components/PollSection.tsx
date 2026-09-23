import React, { useState, useEffect } from 'react';
import { fetchPolls, submitPollVote, type PollVote, type Location, type UserStats } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Share2, Clock, MapPin, Users, Check, AlertCircle } from 'lucide-react';

interface PollSectionProps {
  locations: Location[];
  users: UserStats[];
}

const getTargetMondayStr = () => {
  const d = new Date();
  const day = d.getDay();
  // Se for sexta(5), sábado(6) ou domingo(0), avança para a próxima semana.
  // Caso contrário (1 a 4), fica na semana atual.
  let diffToMonday = 0;
  
  if (day === 0) diffToMonday = 1;
  else if (day === 5) diffToMonday = 3;
  else if (day === 6) diffToMonday = 2;
  else diffToMonday = 1 - day;

  d.setDate(d.getDate() + diffToMonday);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
};

export const PollSection: React.FC<PollSectionProps> = ({ locations, users }) => {
  const { token, profile } = useAuth();
  const [targetWeek] = useState(getTargetMondayStr());
  const [polls, setPolls] = useState<PollVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // User's own choices
  const [myMonday, setMyMonday] = useState<string[]>([]);
  const [myTuesday, setMyTuesday] = useState<string[]>([]);
  const [myWednesday, setMyWednesday] = useState<string[]>([]);
  const [myThursday, setMyThursday] = useState<string[]>([]);
  const [myLocations, setMyLocations] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [cannotPlay, setCannotPlay] = useState(false);
  const [expandedLoc, setExpandedLoc] = useState<string | null>(null);

  const hours = ["19:00", "20:00", "21:00", "22:00"];

  useEffect(() => {
    loadPolls();
  }, [targetWeek]);

  const loadPolls = async () => {
    setLoading(true);
    const data = await fetchPolls(targetWeek, true);
    setPolls(data);
    
    // Check if I already voted
    const myVote = data.find(p => p.UserEmail === profile?.email);
    if (myVote) {
      setMyMonday(myVote.Monday || []);
      setMyTuesday(myVote.Tuesday || []);
      setMyWednesday(myVote.Wednesday || []);
      setMyThursday(myVote.Thursday || []);
      setMyLocations(myVote.Locations || []);
      setHasVoted(true);
      const hasAnyHour = (myVote.Monday?.length || 0) + (myVote.Tuesday?.length || 0) + (myVote.Wednesday?.length || 0) + (myVote.Thursday?.length || 0) > 0;
      setCannotPlay(!hasAnyHour);
    }
    setLoading(false);
  };

  const handleToggleHour = (daySetter: React.Dispatch<React.SetStateAction<string[]>>, current: string[], hour: string) => {
    if (current.includes(hour)) {
      daySetter(current.filter(h => h !== hour));
    } else {
      daySetter([...current, hour]);
    }
  };

  const handleToggleLocation = (locId: string) => {
    if (myLocations.includes(locId)) {
      setMyLocations(myLocations.filter(l => l !== locId));
    } else {
      setMyLocations([...myLocations, locId]);
    }
  };

  const submitVote = async () => {
    if (!token) return;
    setSaving(true);
    const m1 = cannotPlay ? [] : myMonday;
    const m2 = cannotPlay ? [] : myTuesday;
    const m3 = cannotPlay ? [] : myWednesday;
    const m4 = cannotPlay ? [] : myThursday;
    const res = await submitPollVote(token, targetWeek, m1, m2, m3, m4, myLocations);
    if (res.success) {
      setHasVoted(true);
      await loadPolls();
    } else {
      alert("Erro ao gravar: " + res.error);
    }
    setSaving(false);
  };

  const toggleCannotPlay = () => {
    const nextVal = !cannotPlay;
    setCannotPlay(nextVal);
    if (nextVal) {
      setMyMonday([]);
      setMyTuesday([]);
      setMyWednesday([]);
      setMyThursday([]);
    }
  };

  const getFormattedDateRange = () => {
    const start = new Date(targetWeek);
    const end = new Date(targetWeek);
    end.setDate(end.getDate() + 3);
    const formatDayMonth = (d: Date) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    return `${formatDayMonth(start)} a ${formatDayMonth(end)}`;
  };

  const shareOnWhatsApp = () => {
    const url = window.location.origin + "/#/agenda";
    const text = `Votação semana ${getFormattedDateRange()}:\n${url}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Algoritmo: Encontrar os melhores slots agrupados por Dia/Hora
  const calculateGroupedSlots = () => {
    const days = ["Segunda", "Terça", "Quarta", "Quinta"];
    const hours = ["19:00", "20:00", "21:00", "22:00"];
    
    const results: { day: string, time: string, users: string[], locations: { locId: string, users: string[] }[] }[] = [];

    days.forEach(day => {
      hours.forEach(time => {
        const usersAvailable = polls.filter(vote => {
          if (day === "Segunda") return vote.Monday?.includes(time);
          if (day === "Terça") return vote.Tuesday?.includes(time);
          if (day === "Quarta") return vote.Wednesday?.includes(time);
          if (day === "Quinta") return vote.Thursday?.includes(time);
          return false;
        });

        if (usersAvailable.length > 0) {
          const locCounts: Record<string, string[]> = {};
          usersAvailable.forEach(vote => {
            (vote.Locations || []).forEach(locId => {
              if (!locCounts[locId]) locCounts[locId] = [];
              locCounts[locId].push(vote.UserEmail);
            });
          });

          const locsArray = Object.entries(locCounts).map(([locId, emails]) => ({
            locId,
            users: emails
          })).sort((a, b) => b.users.length - a.users.length);

          results.push({
            day: getFormattedDayName(day, days.indexOf(day)),
            time,
            users: usersAvailable.map(v => v.UserEmail),
            locations: locsArray
          });
        }
      });
    });

    return results.sort((a, b) => {
      const maxLocA = a.locations[0]?.users.length || 0;
      const maxLocB = b.locations[0]?.users.length || 0;
      if (maxLocB !== maxLocA) return maxLocB - maxLocA;
      return b.users.length - a.users.length;
    });
  };

  const getFormattedDayName = (dayName: string, offset: number) => {
    const d = new Date(targetWeek);
    d.setDate(d.getDate() + offset);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${dayName} (${day}/${month})`;
  };

  const isDayInPast = (offset: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(targetWeek);
    targetDate.setDate(targetDate.getDate() + offset);
    targetDate.setHours(0, 0, 0, 0);
    return targetDate.getTime() < today.getTime();
  };

  const groupedSlots = calculateGroupedSlots();

  const DayGrid = ({ title, state, setter, disabledDay }: { title: string, state: string[], setter: React.Dispatch<React.SetStateAction<string[]>>, disabledDay?: boolean }) => {
    const isGridDisabled = cannotPlay || disabledDay;
    return (
    <div style={{ flex: 1, minWidth: '150px', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', opacity: isGridDisabled ? 0.3 : 1, pointerEvents: isGridDisabled ? 'none' : 'auto', transition: 'all 0.3s' }}>
      <h4 style={{ marginBottom: '0.75rem', textAlign: 'center', color: 'var(--text-main)' }}>{title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {hours.map(hour => {
          const active = state.includes(hour);
          return (
            <button
              key={hour}
              onClick={() => handleToggleHour(setter, state, hour)}
              style={{
                background: active ? 'var(--primary)' : 'rgba(0,0,0,0.3)',
                color: active ? '#fff' : 'var(--text-muted)',
                border: active ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                padding: '0.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: active ? 'bold' : 'normal',
                transition: 'all 0.2s',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Clock size={14} /> {hour}
            </button>
          )
        })}
      </div>
    </div>
  )};

  return (
    <div className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Organizar Próximo Jogo</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Semana de {getFormattedDateRange()}</p>
        
        <button onClick={shareOnWhatsApp} className="btn-primary" style={{ background: '#25D366', borderColor: '#25D366', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}>
          <Share2 size={16} /> Partilhar no WhatsApp
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Check size={20} color="var(--primary)" /> 1. Disponibilidade Horária
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <DayGrid title={getFormattedDayName("Segunda", 0)} state={myMonday} setter={setMyMonday} disabledDay={isDayInPast(0)} />
          <DayGrid title={getFormattedDayName("Terça", 1)} state={myTuesday} setter={setMyTuesday} disabledDay={isDayInPast(1)} />
          <DayGrid title={getFormattedDayName("Quarta", 2)} state={myWednesday} setter={setMyWednesday} disabledDay={isDayInPast(2)} />
          <DayGrid title={getFormattedDayName("Quinta", 3)} state={myThursday} setter={setMyThursday} disabledDay={isDayInPast(3)} />
        </div>
        
        <button 
          onClick={toggleCannotPlay}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: cannotPlay ? 'var(--danger)' : 'rgba(239, 68, 68, 0.1)',
            color: cannotPlay ? '#fff' : 'var(--danger)',
            border: `1px solid ${cannotPlay ? 'var(--danger)' : 'rgba(239, 68, 68, 0.3)'}`,
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
            marginBottom: '2rem'
          }}
        >
          {cannotPlay ? 'Não poderei ir a nenhum jogo' : 'Não posso jogar esta semana'}
        </button>

        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={20} color="var(--primary)" /> 2. Campos Aceitáveis
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
          {locations.map(loc => {
            const active = myLocations.includes(loc.LocationID);
            return (
              <button
                key={loc.LocationID}
                onClick={() => handleToggleLocation(loc.LocationID)}
                style={{
                  background: active ? 'var(--primary)' : 'rgba(0,0,0,0.3)',
                  color: active ? '#fff' : 'var(--text-muted)',
                  border: active ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                  padding: '0.6rem 1rem',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: active ? 'bold' : 'normal',
                  transition: 'all 0.2s',
                  fontSize: '0.85rem'
                }}
              >
                {loc.Nome}
              </button>
            )
          })}
        </div>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <button onClick={submitVote} disabled={saving} className="btn-primary" style={{ minWidth: '200px' }}>
            {saving ? 'A gravar...' : hasVoted ? 'Atualizar Escolhas' : 'Submeter Escolhas'}
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} color="#10b981" /> Resultados e Sugestões
        </h3>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>A calcular...</p>
        ) : groupedSlots.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
            <AlertCircle size={32} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p style={{ color: 'var(--text-muted)' }}>Ainda não existem votos para esta semana.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Votaram {polls.length} jogadores até agora.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {groupedSlots.map((slot, i) => {
              return (
                <div key={i} style={{ 
                  background: 'rgba(0,0,0,0.2)', 
                  border: '1px solid rgba(255,255,255,0.05)',
                  padding: '1.25rem', 
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  {/* Cabeçalho do Bloco: Dia, Hora e total de utilizadores */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>{slot.day}, {slot.time}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {slot.users.map(email => users.find(u => u.Email === email)?.Nome || email.split('@')[0]).join(', ')}
                      </div>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)', textAlign: 'right' }}>
                      {slot.users.length} <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>Disponíveis</span>
                    </div>
                  </div>

                  {/* Lista de Campos dentro deste Dia/Hora */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {slot.locations.map((locSlot, j) => {
                      const loc = locations.find(l => l.LocationID === locSlot.locId);
                      let minRequired = 6;
                      if (loc?.TipoFutebol?.includes('7v7')) minRequired = 14;
                      else if (loc?.TipoFutebol?.includes('9v9')) minRequired = 18;
                      else if (loc?.TipoFutebol?.includes('11v11')) minRequired = 22;

                      const locViable = locSlot.users.length >= minRequired;
                      const isAbsoluteBest = locViable && i === 0 && j === 0;

                      const locKey = `${slot.day}|${slot.time}|${locSlot.locId}`;
                      const isExpanded = expandedLoc === locKey;

                      return (
                        <div key={locSlot.locId} style={{ display: 'flex', flexDirection: 'column' }}>
                          <div 
                            onClick={() => setExpandedLoc(isExpanded ? null : locKey)}
                            style={{ 
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              background: locViable ? (isAbsoluteBest ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.03)') : 'transparent',
                              border: locViable ? (isAbsoluteBest ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(34, 197, 94, 0.1)') : 'none',
                              padding: '0.5rem', borderRadius: '8px',
                              opacity: locViable ? 1 : 0.6,
                              flexWrap: 'wrap',
                              gap: '0.5rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                              <MapPin size={14} color={locViable ? '#10b981' : 'var(--text-muted)'} /> 
                              <span style={{ color: locViable ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                {loc?.Nome || 'Campo Desconhecido'} {loc?.TipoFutebol ? `(${loc.TipoFutebol})` : ''}
                              </span>
                              {isAbsoluteBest && <span style={{ background: '#10b981', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>IDEAL</span>}
                              {!locViable && <span style={{ background: 'var(--danger)', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>FALTAM {minRequired - locSlot.users.length}</span>}
                            </div>
                            <div style={{ fontWeight: 'bold', color: locViable ? '#10b981' : 'var(--text-muted)' }}>
                              {locSlot.users.length} <span style={{ fontSize: '0.7rem', fontWeight: 'normal' }}>votos</span>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div style={{ 
                              padding: '0.75rem 1rem 0.5rem 2rem', 
                              fontSize: '0.8rem', 
                              color: 'var(--text-muted)',
                              borderLeft: '2px solid rgba(255,255,255,0.05)',
                              marginLeft: '0.5rem',
                              marginTop: '0.25rem',
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '0.5rem'
                            }}>
                              {locSlot.users.map(email => {
                                const u = users.find(u => u.Email === email);
                                return (
                                  <div key={email} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '12px' }}>
                                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'var(--bg-lighter)', overflow: 'hidden' }}>
                                      {u?.Avatar ? <img src={u.Avatar} alt={u.Nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={10} />}
                                    </div>
                                    {u?.Nome || email.split('@')[0]}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={20} color="var(--primary)" /> Estado das Votações
        </h3>
        
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>A carregar...</p>
        ) : (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {(() => {
              const usersFaltam = users.filter(u => !u.IsGuest && !polls.some(p => p.UserEmail === u.Email));
              const usersVotaram = users.filter(u => !u.IsGuest && polls.some(p => p.UserEmail === u.Email));
              const usersDisponiveis = usersVotaram.filter(u => {
                const p = polls.find(poll => poll.UserEmail === u.Email);
                return p && (p.Monday?.length || p.Tuesday?.length || p.Wednesday?.length || p.Thursday?.length || p.Locations?.length);
              });
              const usersIndisponiveis = usersVotaram.filter(u => {
                const p = polls.find(poll => poll.UserEmail === u.Email);
                return p && !p.Monday?.length && !p.Tuesday?.length && !p.Wednesday?.length && !p.Thursday?.length && !p.Locations?.length;
              });

              return (
                <>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h4 style={{ color: '#10b981', marginBottom: '1rem', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', paddingBottom: '0.5rem' }}>
                      Disponíveis ({usersDisponiveis.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {usersDisponiveis.map(u => (
                        <div key={u.Email} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-lighter)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {u.Avatar ? <img src={u.Avatar} alt={u.Nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Users size={12} />}
                          </div>
                          <span style={{ fontSize: '0.9rem' }}>{u.Nome}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h4 style={{ color: 'var(--text-muted)', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.5rem' }}>
                      Não podem ({usersIndisponiveis.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {usersIndisponiveis.map(u => (
                        <div key={u.Email} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.6 }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-lighter)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {u.Avatar ? <img src={u.Avatar} alt={u.Nome} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)' }} /> : <Users size={12} />}
                          </div>
                          <span style={{ fontSize: '0.9rem', textDecoration: 'line-through' }}>{u.Nome}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <h4 style={{ color: 'var(--danger)', marginBottom: '1rem', borderBottom: '1px solid rgba(239, 68, 68, 0.2)', paddingBottom: '0.5rem' }}>
                      Faltam Votar ({usersFaltam.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {usersFaltam.map(u => (
                        <div key={u.Email} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.6 }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-lighter)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {u.Avatar ? <img src={u.Avatar} alt={u.Nome} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)' }} /> : <Users size={12} />}
                          </div>
                          <span style={{ fontSize: '0.9rem' }}>{u.Nome}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
