import { supabase } from './supabaseClient';

export interface UserStats {
  Nome: string;
  Email: string;
  Vitorias: number;
  Empates: number;
  Derrotas: number;
  Pontos_Totais: number;
  Jogos_Jogados: number;
  Avatar: string;
  Ataque: number;
  Defesa: number;
  Fisico: number;
  Passe: number;
  Guarda_Redes: number;
  Fairplay: number;
  Overall: number;
  TotalVotos: number;
  IsGuest?: boolean;
  CreatedBy?: string;
}

export interface GameStats {
  GameID: string;
  Data: string;
  Resultado_A: number;
  Resultado_B: number;
  Equipa_A: string[];
  Equipa_B: string[];
  SessionID?: string;
  SessionType?: 'standard' | 'reidapista' | 'rotacao_dinamica';
  VideoFileId?: string;
  VideoDownloadUrl?: string;
  VideoExpiryDate?: string;
  RoundNumber?: number;
  FieldCost?: number;
  Fee?: number;
  LocationID?: string;
}

export interface Expense {
  ExpenseID: string;
  Data: string;
  Descricao: string;
  Valor: number;
  FotoUrl?: string;
  RegistadoPor?: string;
  ValorCaixa?: number;
  ContribuicoesDiretas?: { email: string; amount: number }[];
}

export const getDriveImageUrl = (url?: string | null) => {
  if (!url) return '';
  const urls = url.split(',').map(u => {
    u = u.trim();
    if (u.includes('drive.google.com/file/d/')) {
      const match = u.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match) return `https://drive.google.com/uc?id=${match[1]}`;
    }
    return u;
  });
  return urls.join(',');
};

export interface SessionRound {
  resA: number;
  resB: number;
  equipaA: string[];
  equipaB: string[];
  roundNumber?: number;
}

export interface Location {
  LocationID: string;
  Nome: string;
  Morada: string;
  PrecoHora: number;
  PrecoBola?: number;
  PrecoColetes?: number;
  TipoPiso?: string;
  Indoor?: number;
  Balnearios?: number;
  TipoFutebol?: string;
  FotosUrl?: string;
  RegistadoPor?: string;
  Telefone?: string;
  Email?: string;
  Notas?: string;
}

export interface PollVote {
  TargetWeek: string;
  UserEmail: string;
  Timestamp?: string;
  Monday: string[];
  Tuesday: string[];
  Wednesday: string[];
  Thursday: string[];
  Locations: string[];
}

export const sortUsersByName = <T extends { Nome?: string; name?: string }>(list: T[]): T[] => {
  return [...list].sort((a, b) => {
    const nameA = a.Nome || (a as any).name || '';
    const nameB = b.Nome || (b as any).name || '';
    return nameA.localeCompare(nameB, 'pt', { sensitivity: 'base' });
  });
};

// Caches for quick navigation
let usersCache: UserStats[] | null = null;
let gamesCache: GameStats[] | null = null;
let expensesCache: Expense[] | null = null;

export const invalidateUsersCache = () => { usersCache = null; };
export const invalidateGamesCache = () => { gamesCache = null; };
export const invalidateExpensesCache = () => { expensesCache = null; };
export const invalidateCache = () => { invalidateUsersCache(); invalidateGamesCache(); invalidateExpensesCache(); };

export const fetchUsers = async (forceRefresh = false): Promise<UserStats[]> => {
  if (!forceRefresh && usersCache) return usersCache;
  const { data, error } = await supabase.from('player_stats').select('*');
  if (error) {
    console.error("fetchUsers error", error);
    return [];
  }
  const mapped = data.map(u => ({
    Nome: u.Nome,
    Email: u.Email,
    Vitorias: Number(u.Vitorias),
    Empates: Number(u.Empates),
    Derrotas: Number(u.Derrotas),
    Pontos_Totais: (Number(u.Vitorias) * 3) + Number(u.Empates),
    Jogos_Jogados: Number(u.Jogos_Jogados),
    Avatar: u.Avatar,
    Ataque: Number(u.Ataque),
    Defesa: Number(u.Defesa),
    Fisico: Number(u.Fisico),
    Passe: Number(u.Passe),
    Guarda_Redes: Number(u.Guarda_Redes),
    Fairplay: Number(u.Fairplay),
    Overall: Math.round((Number(u.Ataque) + Number(u.Defesa) + Number(u.Fisico) + Number(u.Passe) + Number(u.Guarda_Redes) + Number(u.Fairplay)) / 6),
    TotalVotos: Number(u.TotalVotos),
    IsGuest: u.IsGuest
  }));
  usersCache = sortUsersByName(mapped);
  return usersCache;
};

export const fetchGames = async (forceRefresh = false): Promise<GameStats[]> => {
  if (!forceRefresh && gamesCache) return gamesCache;
  const { data, error } = await supabase.from('games').select('*').order('date', { ascending: false });
  if (error) {
    console.error("Error fetching games:", error);
    return [];
  }
  const mapped = data.map(g => ({
    GameID: g.id,
    Data: g.date,
    Resultado_A: g.res_a,
    Resultado_B: g.res_b,
    Equipa_A: g.equipa_a,
    Equipa_B: g.equipa_b,
    SessionID: g.session_id,
    SessionType: g.session_type,
    VideoFileId: g.video_file_id,
    VideoDownloadUrl: g.video_download_url,
    VideoExpiryDate: g.video_expiry_date,
    RoundNumber: g.round_number,
    FieldCost: g.field_cost,
    Fee: g.fee,
    LocationID: g.location_id
  }));
  gamesCache = mapped;
  return gamesCache;
};

export const fetchExpenses = async (forceRefresh = false): Promise<Expense[]> => {
  if (!forceRefresh && expensesCache) return expensesCache;
  const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
  if (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }
  const mapped = data.map(e => ({
    ExpenseID: e.id,
    Data: e.date,
    Descricao: e.descricao,
    Valor: e.valor,
    FotoUrl: getDriveImageUrl(e.foto_url),
    RegistadoPor: e.registado_por,
    ValorCaixa: e.valor_caixa,
    ContribuicoesDiretas: e.contribuicoes_diretas
  }));
  expensesCache = mapped;
  return expensesCache;
};

export const fetchLocations = async (): Promise<Location[]> => {
  const { data, error } = await supabase.from('global_locations').select('*');
  if (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
  return data.map(l => ({
    LocationID: l.id, Nome: l.nome, Morada: l.morada, PrecoHora: l.preco_hora, PrecoBola: l.preco_bola,
    PrecoColetes: l.preco_coletes, TipoPiso: l.tipo_piso, Indoor: l.indoor, Balnearios: l.balnearios,
    TipoFutebol: l.tipo_futebol, FotosUrl: getDriveImageUrl(l.fotos_url), RegistadoPor: l.registado_por, Telefone: l.telefone,
    Email: l.email, Notas: l.notas
  }));
};

export const fetchPolls = async (weekId: string, _forceRefresh?: boolean): Promise<PollVote[]> => {
  const { data, error } = await supabase.from('polls').select('*').eq('target_week', weekId);
  if (error) {
    console.error("Error fetching polls:", error);
    return [];
  }
  return data.map(p => ({
    TargetWeek: p.target_week, UserEmail: p.user_email, Timestamp: p.timestamp,
    Monday: p.monday, Tuesday: p.tuesday, Wednesday: p.wednesday, Thursday: p.thursday, Locations: p.locations
  }));
};

// WRITE OPERATIONS
export const registerUser = async (): Promise<{ success: boolean; isNewUser: boolean }> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { success: false, isNewUser: false };

  const user = session.user;
  const { data } = await supabase.from('users').select('email').eq('email', user.email).single();

  if (!data) {
    await supabase.from('users').insert({
      email: user.email,
      nome: user.user_metadata.full_name || 'User',
      avatar_url: user.user_metadata.avatar_url || ''
    });
    return { success: true, isNewUser: true };
  }
  return { success: true, isNewUser: false };
};

export const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
  // Requires edge function or direct call if RLS allows, for now we just sign out
  await supabase.auth.signOut();
  return { success: true };
};

export const updateProfile = async (
  _token: string,
  data: { name?: string; avatar?: string }
): Promise<{ success: boolean; message?: string; name?: string; avatar?: string; error?: string }> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const updates: any = {};
  if (data.name) updates.nome = data.name;
  if (data.avatar) updates.avatar_url = data.avatar;

  const { error } = await supabase.from('users').update(updates).eq('email', session.user.email);
  if (error) return { success: false, error: error.message };

  invalidateUsersCache();
  return { success: true, message: 'Perfil atualizado' };
};

export const updateAvatar = async (_token: string, base64: string) => updateProfile(_token, { avatar: base64 });

export const votePlayer = async (_token: string, targetEmail: string, ataque: number, defesa: number, fisico: number, passe: number, guardaRedes: number, fairplay: number) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { success: false, error: 'Unauthorized' };

  const { error } = await supabase.from('votes').upsert({
    voter_email: session.user.email,
    target_email: targetEmail,
    ataque, defesa, fisico, passe, guarda_redes: guardaRedes, fairplay
  }, { onConflict: 'voter_email, target_email' });

  if (error) return { success: false, error: error.message };
  invalidateUsersCache();
  return { success: true };
};

export const fetchMyVotes = async (): Promise<Record<string, any>> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  const { data } = await supabase.from('votes').select('*').eq('voter_email', session.user.email);
  if (!data) return {};
  const res: Record<string, any> = {};
  data.forEach(v => {
    res[v.target_email] = {
      ataque: v.ataque, defesa: v.defesa, fisico: v.fisico,
      passe: v.passe, guardaRedes: v.guarda_redes, fairplay: v.fairplay
    };
  });
  return res;
};

const DEFAULT_GROUP_ID = '34f5269e-1aac-4041-93a9-0841bb7cf3ed';

export const registerGame = async (
  _token: string,
  date: string,
  resA: number,
  resB: number,
  equipaA: string[],
  equipaB: string[],
  videoData?: { fileId?: string; downloadUrl?: string; expiryDate?: string },
  _unused?: any,
  sessionType = 'standard',
  roundNumber = 1,
  fieldCost = 0,
  fee = 0,
  locationId?: string
): Promise<{ success: boolean; gameId?: string; error?: string }> => {
  const gameDate = date ? new Date(date).toISOString() : new Date().toISOString();
  const { data, error } = await supabase.from('games').insert({
    group_id: DEFAULT_GROUP_ID,
    date: gameDate,
    res_a: resA,
    res_b: resB,
    equipa_a: equipaA,
    equipa_b: equipaB,
    session_id: null,
    session_type: sessionType,
    video_file_id: videoData?.fileId || null,
    video_download_url: videoData?.downloadUrl || null,
    video_expiry_date: videoData?.expiryDate || null,
    round_number: roundNumber,
    field_cost: fieldCost,
    fee: fee,
    location_id: locationId || null
  }).select().single();

  if (error) {
    console.error("Error registering game:", error);
    return { success: false, error: error.message };
  }
  invalidateGamesCache();
  invalidateUsersCache();
  return { success: true, gameId: data?.id };
};

export const editGame = async (
  _token: string,
  gameId: string,
  date: string,
  resA: number,
  resB: number,
  equipaA: string[],
  equipaB: string[],
  videoData?: { fileId?: string; downloadUrl?: string; expiryDate?: string },
  locationId?: string
): Promise<{ success: boolean; error?: string }> => {
  const gameDate = date ? new Date(date).toISOString() : new Date().toISOString();
  const updatePayload: any = {
    date: gameDate,
    res_a: resA,
    res_b: resB,
    equipa_a: equipaA,
    equipa_b: equipaB,
  };
  if (videoData) {
    updatePayload.video_file_id = videoData.fileId;
    updatePayload.video_download_url = videoData.downloadUrl;
    updatePayload.video_expiry_date = videoData.expiryDate;
  }
  if (locationId !== undefined) {
    updatePayload.location_id = locationId;
  }

  const { data, error } = await supabase.from('games').update(updatePayload).eq('id', gameId).select();
  if (error) {
    console.error("Error editing game:", error);
    return { success: false, error: error.message };
  }
  if (!data || data.length === 0) {
    return { success: false, error: "Jogo não alterado. Verifica as permissões (RLS) no Supabase." };
  }
  invalidateGamesCache();
  invalidateUsersCache();
  return { success: true };
};

export const deleteGame = async (_token: string, gameId: string): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase.from('games').delete().eq('id', gameId);
  if (error) {
    console.error("Error deleting game:", error);
    return { success: false, error: error.message };
  }
  invalidateGamesCache();
  invalidateUsersCache();
  return { success: true };
};

export const registerSession = async (
  _token: string,
  params: {
    date: string;
    sessionType: string;
    rounds: { resA: number; resB: number; equipaA: string[]; equipaB: string[]; roundNumber?: number }[];
    videoFileId?: string;
    videoDownloadUrl?: string;
    videoExpiryDate?: string;
    locationId?: string;
  }
): Promise<{ success: boolean; sessionId?: string; error?: string }> => {
  const sessionId = crypto.randomUUID();
  const gameDate = params.date ? new Date(params.date).toISOString() : new Date().toISOString();
  
  const rows = params.rounds.map((r, idx) => ({
    group_id: DEFAULT_GROUP_ID,
    date: gameDate,
    res_a: r.resA,
    res_b: r.resB,
    equipa_a: r.equipaA,
    equipa_b: r.equipaB,
    session_id: sessionId,
    session_type: params.sessionType,
    video_file_id: params.videoFileId || null,
    video_download_url: params.videoDownloadUrl || null,
    video_expiry_date: params.videoExpiryDate || null,
    round_number: r.roundNumber || (idx + 1),
    field_cost: 0,
    fee: 0,
    location_id: params.locationId || null
  }));

  const { error } = await supabase.from('games').insert(rows);
  if (error) {
    console.error("Error registering session:", error);
    return { success: false, error: error.message };
  }
  invalidateGamesCache();
  invalidateUsersCache();
  return { success: true, sessionId };
};

export const registerExpense = async (
  _token: string,
  date: string,
  description: string,
  totalAmount: number,
  photoUrlStr?: string,
  boxAmount?: number,
  formattedContribs?: any[]
): Promise<{ success: boolean; error?: string }> => {
  const { data: { session } } = await supabase.auth.getSession();
  const { error } = await supabase.from('expenses').insert({
    group_id: DEFAULT_GROUP_ID,
    date: date ? new Date(date).toISOString() : new Date().toISOString(),
    descricao: description,
    valor: totalAmount,
    foto_url: photoUrlStr || null,
    registado_por: session?.user?.email || 'utilizador',
    valor_caixa: boxAmount || 0,
    contribuicoes_diretas: formattedContribs || []
  });

  if (error) {
    console.error("Error registering expense:", error);
    return { success: false, error: error.message };
  }
  invalidateExpensesCache();
  return { success: true };
};

export const editExpense = async (
  _token: string,
  expenseId: string,
  date: string,
  description: string,
  totalAmount: number,
  photoUrlStr?: string,
  boxAmount?: number,
  formattedContribs?: any[]
): Promise<{ success: boolean; error?: string }> => {
  const { data, error } = await supabase.from('expenses').update({
    date: date ? new Date(date).toISOString() : new Date().toISOString(),
    descricao: description,
    valor: totalAmount,
    foto_url: photoUrlStr || null,
    valor_caixa: boxAmount || 0,
    contribuicoes_diretas: formattedContribs || []
  }).eq('id', expenseId).select();

  if (error) {
    console.error("Error editing expense:", error);
    return { success: false, error: error.message };
  }
  if (!data || data.length === 0) {
    return { success: false, error: "Despesa não alterada. Verifica as permissões (RLS) no Supabase." };
  }
  invalidateExpensesCache();
  return { success: true };
};

export const submitPollVote = async (_token: string, targetWeek: string, monday: string[], tuesday: string[], wednesday: string[], thursday: string[], locations: string[]): Promise<{ success: boolean, error?: string }> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { success: false, error: 'User not authenticated' };
  
  const { error } = await supabase.from('polls').upsert({
    group_id: DEFAULT_GROUP_ID,
    target_week: targetWeek,
    user_email: session.user.email,
    monday,
    tuesday,
    wednesday,
    thursday,
    locations,
    timestamp: new Date().toISOString()
  }, { onConflict: 'group_id,target_week,user_email' });

  if (error) {
    console.error("Error submitting poll:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
};

export const createGuestPlayer = async (
  _token: string,
  name: string
): Promise<{ success: boolean; user?: any; error?: string }> => {
  if (!name || !name.trim()) return { success: false, error: "Nome inválido." };
  
  const guestEmail = `guest_${crypto.randomUUID().substring(0, 8)}@convidado.tikitasco`;
  const { data: { session } } = await supabase.auth.getSession();
  
  const { data, error } = await supabase.from('users').insert({
    email: guestEmail,
    name: name.trim(),
    avatar_url: '',
    is_guest: true,
    created_by: session?.user?.email || null
  }).select().single();

  if (error) {
    console.error("Error creating guest player:", error);
    return { success: false, error: error.message };
  }
  invalidateUsersCache();
  return {
    success: true,
    user: {
      Nome: data.name,
      Email: data.email,
      Vitorias: 0,
      Empates: 0,
      Derrotas: 0,
      Pontos_Totais: 0,
      Jogos_Jogados: 0,
      Avatar: '',
      IsGuest: true
    }
  };
};

export const editGuestName = async (
  _token: string,
  guestEmail: string,
  newName: string
): Promise<{ success: boolean; error?: string }> => {
  if (!newName || !newName.trim()) return { success: false, error: "Nome inválido." };
  const { error } = await supabase.from('users').update({ name: newName.trim() }).eq('email', guestEmail);
  if (error) {
    console.error("Error updating guest name:", error);
    return { success: false, error: error.message };
  }
  invalidateUsersCache();
  return { success: true };
};

export const claimGhostPlayer = async (
  _token: string,
  ghostEmail: string
): Promise<{ success: boolean; error?: string; message?: string }> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { success: false, error: 'Unauthorized' };
  const realEmail = session.user.email;
  if (!realEmail) return { success: false, error: 'No user email' };

  // 1. Atualizar jogos na tabela games
  const { data: games } = await supabase.from('games').select('*');
  if (games) {
    for (const g of games) {
      let modified = false;
      let eqA: string[] = Array.isArray(g.equipa_a) ? g.equipa_a : [];
      let eqB: string[] = Array.isArray(g.equipa_b) ? g.equipa_b : [];
      if (eqA.includes(ghostEmail)) {
        eqA = eqA.map(e => e === ghostEmail ? realEmail : e);
        modified = true;
      }
      if (eqB.includes(ghostEmail)) {
        eqB = eqB.map(e => e === ghostEmail ? realEmail : e);
        modified = true;
      }
      if (modified) {
        await supabase.from('games').update({ equipa_a: eqA, equipa_b: eqB }).eq('id', g.id);
      }
    }
  }

  // 2. Atualizar votos eliminando conflitos prévios
  await supabase.from('votes').delete().or(`and(voter_email.eq.${realEmail},target_email.eq.${ghostEmail}),and(voter_email.eq.${ghostEmail},target_email.eq.${realEmail})`);
  await supabase.from('votes').update({ voter_email: realEmail }).eq('voter_email', ghostEmail);
  await supabase.from('votes').update({ target_email: realEmail }).eq('target_email', ghostEmail);

  // 3. Remover utilizador temporário
  await supabase.from('users').delete().eq('email', ghostEmail);

  invalidateUsersCache();
  invalidateGamesCache();
  return { success: true, message: 'Perfil associado com sucesso!' };
};

export const uploadFileToSupabase = async (file: File, bucket: string, path: string): Promise<{ success: boolean, url?: string, error?: string }> => {
  const { data: _data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) return { success: false, error: error.message };
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
  return { success: true, url: publicUrl };
};

export const initiateVideoUpload = async (..._args: any[]) => ({ success: true });
export const finalizeVideoUpload = async (..._args: any[]) => ({ success: true });

export const uploadReceiptToDrive = async (_token: string, fileData: string | File, fileName?: string): Promise<{ success: boolean, fileUrl?: string, error?: string }> => {
  let f: File;
  if (typeof fileData === 'string') {
    const res = await fetch(fileData);
    const blob = await res.blob();
    f = new File([blob], fileName || 'upload.jpg', { type: blob.type });
  } else {
    f = fileData;
  }
  const ext = f.name.split('.').pop();
  const path = `receipts/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
  const res = await uploadFileToSupabase(f, 'tikitasco-storage', path);
  return { success: res.success, fileUrl: res.url, error: res.error };
};

export const uploadVideoToDrive = async (file: File): Promise<{ success: boolean, url?: string, error?: string }> => {
  const ext = file.name.split('.').pop();
  const path = `videos/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
  return uploadFileToSupabase(file, 'tikitasco-storage', path);
};

export const registerLocation = async (
  _token: string,
  nome: string,
  morada?: string,
  precoHora?: number,
  precoBola?: number,
  precoColetes?: number,
  tipoPiso?: string,
  indoor?: boolean | number,
  balnearios?: boolean | number,
  tipoFutebol?: string,
  fotosUrl?: string,
  telefone?: string,
  email?: string,
  notas?: string
): Promise<{ success: boolean; error?: string }> => {
  const { data: { session } } = await supabase.auth.getSession();
  const { error } = await supabase.from('global_locations').insert({
    nome,
    morada: morada || null,
    preco_hora: precoHora ?? null,
    preco_bola: precoBola ?? null,
    preco_coletes: precoColetes ?? null,
    tipo_piso: tipoPiso || null,
    indoor: indoor ? 1 : 0,
    balnearios: balnearios ? 1 : 0,
    tipo_futebol: tipoFutebol || null,
    fotos_url: fotosUrl || null,
    registado_por: session?.user?.email || null,
    telefone: telefone || null,
    email: email || null,
    notas: notas || null
  });
  if (error) {
    console.error("Error registering location:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
};

export const editLocation = async (
  _token: string,
  locationId: string,
  nome: string,
  morada?: string,
  precoHora?: number,
  precoBola?: number,
  precoColetes?: number,
  tipoPiso?: string,
  indoor?: boolean | number,
  balnearios?: boolean | number,
  tipoFutebol?: string,
  fotosUrl?: string,
  telefone?: string,
  email?: string,
  notas?: string
): Promise<{ success: boolean; error?: string }> => {
  const { data, error } = await supabase.from('global_locations').update({
    nome,
    morada: morada || null,
    preco_hora: precoHora ?? null,
    preco_bola: precoBola ?? null,
    preco_coletes: precoColetes ?? null,
    tipo_piso: tipoPiso || null,
    indoor: indoor ? 1 : 0,
    balnearios: balnearios ? 1 : 0,
    tipo_futebol: tipoFutebol || null,
    fotos_url: fotosUrl || null,
    telefone: telefone || null,
    email: email || null,
    notas: notas || null
  }).eq('id', locationId).select();
  if (error) {
    console.error("Error editing location:", error);
    return { success: false, error: error.message };
  }
  if (!data || data.length === 0) {
    return { success: false, error: "A alteração não foi gravada. Verifica se a política de UPDATE do RLS está ativa na tabela global_locations." };
  }
  return { success: true };
};

export const deleteLocation = async (_token: string, id: string): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase.from('global_locations').delete().eq('id', id);
  if (error) {
    console.error("Error deleting location:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
};
